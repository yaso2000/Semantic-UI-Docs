from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
import stripe
import socketio

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'])

# Stripe Configuration
stripe.api_key = os.environ['STRIPE_SECRET_KEY']

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)
socket_app = socketio.ASGIApp(sio, app)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "client"  # client or admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CalculatorHistory(BaseModel):
    user_id: str
    calculator_type: str  # bmi, tdee, anxiety
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HourlyPackage(BaseModel):
    id: Optional[str] = None
    name: str
    hours: int
    price: float
    description: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    package_id: str
    payment_method: str  # stripe or paypal

class BookingResponse(BaseModel):
    id: str
    client_id: str
    package_id: str
    package_name: str
    hours_purchased: int
    hours_used: int
    amount_paid: float
    payment_method: str
    payment_status: str
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime

class Message(BaseModel):
    id: Optional[str] = None
    sender_id: str
    recipient_id: str
    message: str
    attachment: Optional[str] = None  # base64 encoded file
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class IntakeQuestionnaireResponse(BaseModel):
    user_id: str
    responses: Dict[str, Any]  # Questions and answers
    pillars_assessment: Dict[str, int]  # Physical, Diet, Mental, Spiritual scores
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Resource(BaseModel):
    id: Optional[str] = None
    title: str
    category: str  # physical, nutritional, mental, spiritual
    file_data: str  # base64 encoded
    file_name: str
    description: str
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HabitTracker(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD
    habits_completed: List[str]
    notes: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = {
        "_id": user_id,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        created_at=user_dict["created_at"]
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["_id"]})
    
    user_response = UserResponse(
        id=user["_id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

# ==================== CALCULATOR ENDPOINTS ====================

@api_router.post("/calculators/save")
async def save_calculator_history(calc_data: CalculatorHistory, current_user: dict = Depends(get_current_user)):
    calc_dict = calc_data.dict()
    calc_dict["_id"] = str(uuid.uuid4())
    await db.calculator_history.insert_one(calc_dict)
    return {"message": "Calculator history saved", "id": calc_dict["_id"]}

@api_router.get("/calculators/history/{calculator_type}")
async def get_calculator_history(calculator_type: str, current_user: dict = Depends(get_current_user)):
    history = await db.calculator_history.find({
        "user_id": current_user["_id"],
        "calculator_type": calculator_type
    }).sort("timestamp", -1).to_list(100)
    return history

# ==================== HOURLY PACKAGES ENDPOINTS ====================

@api_router.post("/packages", response_model=HourlyPackage)
async def create_package(package: HourlyPackage, admin_user: dict = Depends(get_admin_user)):
    package_dict = package.dict()
    package_dict["_id"] = str(uuid.uuid4())
    package_dict["id"] = package_dict["_id"]
    await db.hourly_packages.insert_one(package_dict)
    return HourlyPackage(**package_dict)

@api_router.get("/packages", response_model=List[HourlyPackage])
async def get_packages():
    packages = await db.hourly_packages.find({"active": True}).to_list(100)
    return [HourlyPackage(**pkg) for pkg in packages]

@api_router.put("/packages/{package_id}")
async def update_package(package_id: str, package: HourlyPackage, admin_user: dict = Depends(get_admin_user)):
    package_dict = package.dict(exclude_unset=True)
    await db.hourly_packages.update_one({"_id": package_id}, {"$set": package_dict})
    return {"message": "Package updated"}

@api_router.delete("/packages/{package_id}")
async def delete_package(package_id: str, admin_user: dict = Depends(get_admin_user)):
    await db.hourly_packages.update_one({"_id": package_id}, {"$set": {"active": False}})
    return {"message": "Package deleted"}

# ==================== BOOKING & PAYMENT ENDPOINTS ====================

@api_router.post("/bookings/create", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Get package details
    package = await db.hourly_packages.find_one({"_id": booking.package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Create Stripe payment intent
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(package["price"] * 100),  # Amount in cents
            currency="usd",
            metadata={
                "client_id": current_user["_id"],
                "package_id": booking.package_id
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment failed: {str(e)}")
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking_dict = {
        "_id": booking_id,
        "client_id": current_user["_id"],
        "package_id": booking.package_id,
        "package_name": package["name"],
        "hours_purchased": package["hours"],
        "hours_used": 0,
        "amount_paid": package["price"],
        "payment_method": booking.payment_method,
        "payment_status": "pending",
        "stripe_payment_intent_id": payment_intent.id,
        "created_at": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_dict)
    
    return BookingResponse(**booking_dict, id=booking_id)

@api_router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id, "client_id": current_user["_id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update booking status
    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"payment_status": "completed"}}
    )
    
    return {"message": "Booking confirmed", "client_secret": booking.get("stripe_payment_intent_id")}

@api_router.get("/bookings/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"client_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    return [BookingResponse(**booking, id=booking["_id"]) for booking in bookings]

@api_router.get("/bookings/all", response_model=List[BookingResponse])
async def get_all_bookings(admin_user: dict = Depends(get_admin_user)):
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [BookingResponse(**booking, id=booking["_id"]) for booking in bookings]

# ==================== MESSAGING ENDPOINTS ====================

@api_router.get("/messages/{recipient_id}")
async def get_messages(recipient_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["_id"], "recipient_id": recipient_id},
            {"sender_id": recipient_id, "recipient_id": current_user["_id"]}
        ]
    }).sort("timestamp", 1).to_list(1000)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": recipient_id, "recipient_id": current_user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.post("/messages/send")
async def send_message(message: Message, current_user: dict = Depends(get_current_user)):
    message_dict = message.dict()
    message_dict["_id"] = str(uuid.uuid4())
    message_dict["sender_id"] = current_user["_id"]
    await db.messages.insert_one(message_dict)
    
    # Emit socket event
    await sio.emit('new_message', message_dict, room=message.recipient_id)
    
    return {"message": "Message sent", "id": message_dict["_id"]}

@api_router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get all unique conversation partners
    sent = await db.messages.distinct("recipient_id", {"sender_id": current_user["_id"]})
    received = await db.messages.distinct("sender_id", {"recipient_id": current_user["_id"]})
    
    conversation_ids = list(set(sent + received))
    
    conversations = []
    for user_id in conversation_ids:
        user = await db.users.find_one({"_id": user_id})
        if user:
            # Get last message
            last_message = await db.messages.find_one({
                "$or": [
                    {"sender_id": current_user["_id"], "recipient_id": user_id},
                    {"sender_id": user_id, "recipient_id": current_user["_id"]}
                ]
            }, sort=[("timestamp", -1)])
            
            # Count unread messages
            unread_count = await db.messages.count_documents({
                "sender_id": user_id,
                "recipient_id": current_user["_id"],
                "read": False
            })
            
            conversations.append({
                "user_id": user_id,
                "full_name": user["full_name"],
                "email": user["email"],
                "last_message": last_message.get("message", "") if last_message else "",
                "last_message_time": last_message.get("timestamp") if last_message else None,
                "unread_count": unread_count
            })
    
    return conversations

# ==================== INTAKE QUESTIONNAIRE ====================

@api_router.post("/intake/submit")
async def submit_intake(intake: IntakeQuestionnaireResponse, current_user: dict = Depends(get_current_user)):
    intake_dict = intake.dict()
    intake_dict["_id"] = str(uuid.uuid4())
    intake_dict["user_id"] = current_user["_id"]
    await db.intake_responses.insert_one(intake_dict)
    return {"message": "Intake questionnaire submitted", "id": intake_dict["_id"]}

@api_router.get("/intake/my-intake")
async def get_my_intake(current_user: dict = Depends(get_current_user)):
    intake = await db.intake_responses.find_one({"user_id": current_user["_id"]}, sort=[("timestamp", -1)])
    return intake

@api_router.get("/intake/all")
async def get_all_intakes(admin_user: dict = Depends(get_admin_user)):
    intakes = await db.intake_responses.find().sort("timestamp", -1).to_list(1000)
    return intakes

# ==================== RESOURCE LIBRARY ====================

@api_router.post("/resources/upload")
async def upload_resource(resource: Resource, admin_user: dict = Depends(get_admin_user)):
    resource_dict = resource.dict()
    resource_dict["_id"] = str(uuid.uuid4())
    resource_dict["id"] = resource_dict["_id"]
    resource_dict["uploaded_by"] = admin_user["_id"]
    await db.resources.insert_one(resource_dict)
    return {"message": "Resource uploaded", "id": resource_dict["_id"]}

@api_router.get("/resources", response_model=List[Resource])
async def get_resources(category: Optional[str] = None):
    query = {"category": category} if category else {}
    resources = await db.resources.find(query).sort("created_at", -1).to_list(1000)
    return [Resource(**res) for res in resources]

@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, admin_user: dict = Depends(get_admin_user)):
    await db.resources.delete_one({"_id": resource_id})
    return {"message": "Resource deleted"}

# ==================== HABIT TRACKER ====================

@api_router.post("/habits/save")
async def save_habits(habit: HabitTracker, current_user: dict = Depends(get_current_user)):
    habit_dict = habit.dict()
    habit_dict["_id"] = f"{current_user['_id']}_{habit.date}"
    habit_dict["user_id"] = current_user["_id"]
    
    # Upsert (update if exists, insert if not)
    await db.habits.update_one(
        {"_id": habit_dict["_id"]},
        {"$set": habit_dict},
        upsert=True
    )
    return {"message": "Habits saved"}

@api_router.get("/habits/my-habits")
async def get_my_habits(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    habits = await db.habits.find({
        "user_id": current_user["_id"],
        "date": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    return habits

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find({"role": "client"}).to_list(1000)
    return [{"id": u["_id"], "email": u["email"], "full_name": u["full_name"], "created_at": u["created_at"]} for u in users]

@api_router.get("/admin/coaches")
async def get_all_coaches(admin_user: dict = Depends(get_admin_user)):
    coaches = await db.users.find({"role": "coach"}).to_list(1000)
    return [{"id": u["_id"], "email": u["email"], "full_name": u["full_name"], "created_at": u["created_at"]} for u in coaches]

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "client"})
    total_coaches = await db.users.count_documents({"role": "coach"})
    total_bookings = await db.bookings.count_documents({})
    active_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    total_revenue = await db.bookings.aggregate([
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]["total"] if total_revenue else 0
    
    return {
        "total_users": total_users,
        "coaches": total_coaches,
        "total_bookings": total_bookings,
        "total_revenue": revenue,
        "active_subscriptions": active_subscriptions
    }

# ==================== ADMIN SUBSCRIPTION MANAGEMENT ====================

@api_router.get("/admin/subscriptions")
async def get_all_subscriptions(admin_user: dict = Depends(get_admin_user)):
    subscriptions = await db.subscriptions.find().sort("created_at", -1).to_list(1000)
    result = []
    for sub in subscriptions:
        coach = await db.users.find_one({"_id": sub["coach_id"]})
        result.append({
            "id": sub["_id"],
            "coach_id": sub["coach_id"],
            "coach_name": coach["full_name"] if coach else "Unknown",
            "coach_email": coach["email"] if coach else "",
            "plan": sub["plan"],
            "status": sub["status"],
            "start_date": sub["start_date"],
            "end_date": sub["end_date"],
            "amount": sub["amount"]
        })
    return result

@api_router.post("/admin/grant-subscription")
async def grant_subscription(data: dict, admin_user: dict = Depends(get_admin_user)):
    coach_id = data.get("coach_id")
    plan = data.get("plan", "monthly")
    duration_months = data.get("duration_months", 1)
    
    if not coach_id:
        raise HTTPException(status_code=400, detail="Coach ID required")
    
    # Check if coach exists
    coach = await db.users.find_one({"_id": coach_id, "role": "coach"})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    from datetime import datetime, timedelta
    start_date = datetime.utcnow()
    
    if plan == "yearly":
        end_date = start_date + timedelta(days=365 * duration_months // 12)
        amount = 399 * duration_months // 12
    else:
        end_date = start_date + timedelta(days=30 * duration_months)
        amount = 49 * duration_months
    
    subscription = {
        "_id": str(uuid.uuid4()),
        "coach_id": coach_id,
        "plan": plan,
        "status": "active",
        "start_date": start_date,
        "end_date": end_date,
        "amount": amount,
        "granted_by": admin_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.subscriptions.insert_one(subscription)
    
    # Activate coach profile
    await db.coach_profiles.update_one(
        {"user_id": coach_id},
        {"$set": {"is_active": True}},
        upsert=True
    )
    
    return {"message": "Subscription granted", "subscription_id": subscription["_id"]}

@api_router.put("/admin/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(subscription_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.subscriptions.update_one(
        {"_id": subscription_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get subscription to deactivate coach
    subscription = await db.subscriptions.find_one({"_id": subscription_id})
    if subscription:
        await db.coach_profiles.update_one(
            {"user_id": subscription["coach_id"]},
            {"$set": {"is_active": False}}
        )
    
    return {"message": "Subscription cancelled"}

@api_router.get("/admin/coaches-with-status")
async def get_coaches_with_status(admin_user: dict = Depends(get_admin_user)):
    coaches = await db.users.find({"role": "coach"}).to_list(1000)
    result = []
    
    for coach in coaches:
        # Check for active subscription
        subscription = await db.subscriptions.find_one({
            "coach_id": coach["_id"],
            "status": "active"
        })
        
        result.append({
            "id": coach["_id"],
            "full_name": coach["full_name"],
            "email": coach["email"],
            "created_at": coach["created_at"],
            "has_subscription": subscription is not None,
            "subscription_status": subscription["status"] if subscription else None
        })
    
    return result

@api_router.put("/admin/users/{user_id}/role")
async def change_user_role(user_id: str, data: dict, admin_user: dict = Depends(get_admin_user)):
    new_role = data.get("role")
    if new_role not in ["client", "coach"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

# ==================== ADMIN SETTINGS ====================

@api_router.get("/admin/settings")
async def get_admin_settings(admin_user: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"type": "platform"})
    if not settings:
        return {"min_hourly_rate": 20, "max_hourly_rate": 200}
    return {
        "min_hourly_rate": settings.get("min_hourly_rate", 20),
        "max_hourly_rate": settings.get("max_hourly_rate", 200)
    }

@api_router.put("/admin/settings")
async def update_admin_settings(data: dict, admin_user: dict = Depends(get_admin_user)):
    await db.settings.update_one(
        {"type": "platform"},
        {"$set": {
            "min_hourly_rate": data.get("min_hourly_rate", 20),
            "max_hourly_rate": data.get("max_hourly_rate", 200),
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    return {"message": "Settings updated"}

@api_router.get("/settings/price-limits")
async def get_price_limits():
    settings = await db.settings.find_one({"type": "platform"})
    if not settings:
        return {"min_hourly_rate": 20, "max_hourly_rate": 200}
    return {
        "min_hourly_rate": settings.get("min_hourly_rate", 20),
        "max_hourly_rate": settings.get("max_hourly_rate", 200)
    }

# ==================== COACH PACKAGES ====================

@api_router.get("/coach/my-packages")
async def get_coach_packages(coach_user: dict = Depends(get_coach_user)):
    packages = await db.coach_packages.find({"coach_id": coach_user["_id"]}).to_list(100)
    return [{
        "id": p["_id"],
        "name": p["name"],
        "hours": p["hours"],
        "price": p["price"],
        "hourly_rate": p.get("hourly_rate", p["price"] / p["hours"]),
        "description": p.get("description", "")
    } for p in packages]

@api_router.post("/coach/my-packages")
async def create_coach_package(data: dict, coach_user: dict = Depends(get_coach_user)):
    # Validate price limits
    settings = await db.settings.find_one({"type": "platform"})
    min_rate = settings.get("min_hourly_rate", 20) if settings else 20
    max_rate = settings.get("max_hourly_rate", 200) if settings else 200
    
    hourly_rate = data.get("hourly_rate", data["price"] / data["hours"])
    
    if hourly_rate < min_rate:
        raise HTTPException(status_code=400, detail=f"الحد الأدنى لسعر الساعة هو ${min_rate}")
    if hourly_rate > max_rate:
        raise HTTPException(status_code=400, detail=f"الحد الأعلى لسعر الساعة هو ${max_rate}")
    
    package = {
        "_id": str(uuid.uuid4()),
        "coach_id": coach_user["_id"],
        "name": data["name"],
        "hours": data["hours"],
        "price": data["price"],
        "hourly_rate": hourly_rate,
        "description": data.get("description", ""),
        "active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.coach_packages.insert_one(package)
    return {"message": "Package created", "package_id": package["_id"]}

@api_router.put("/coach/my-packages/{package_id}")
async def update_coach_package(package_id: str, data: dict, coach_user: dict = Depends(get_coach_user)):
    # Verify ownership
    package = await db.coach_packages.find_one({"_id": package_id, "coach_id": coach_user["_id"]})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Validate price limits
    settings = await db.settings.find_one({"type": "platform"})
    min_rate = settings.get("min_hourly_rate", 20) if settings else 20
    max_rate = settings.get("max_hourly_rate", 200) if settings else 200
    
    hourly_rate = data.get("hourly_rate", data["price"] / data["hours"])
    
    if hourly_rate < min_rate:
        raise HTTPException(status_code=400, detail=f"الحد الأدنى لسعر الساعة هو ${min_rate}")
    if hourly_rate > max_rate:
        raise HTTPException(status_code=400, detail=f"الحد الأعلى لسعر الساعة هو ${max_rate}")
    
    await db.coach_packages.update_one(
        {"_id": package_id},
        {"$set": {
            "name": data["name"],
            "hours": data["hours"],
            "price": data["price"],
            "hourly_rate": hourly_rate,
            "description": data.get("description", ""),
            "updated_at": datetime.utcnow()
        }}
    )
    return {"message": "Package updated"}

@api_router.delete("/coach/my-packages/{package_id}")
async def delete_coach_package(package_id: str, coach_user: dict = Depends(get_coach_user)):
    result = await db.coach_packages.delete_one({"_id": package_id, "coach_id": coach_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"message": "Package deleted"}

@api_router.get("/coaches/{coach_id}/packages")
async def get_public_coach_packages(coach_id: str):
    packages = await db.coach_packages.find({"coach_id": coach_id, "active": True}).to_list(100)
    return [{
        "id": p["_id"],
        "name": p["name"],
        "hours": p["hours"],
        "price": p["price"],
        "hourly_rate": p.get("hourly_rate", p["price"] / p["hours"]),
        "description": p.get("description", "")
    } for p in packages]

# ==================== COACH ENDPOINTS ====================

async def get_coach_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["coach", "admin"]:
        raise HTTPException(status_code=403, detail="Coach access required")
    return current_user

@api_router.get("/coach/stats")
async def get_coach_stats(coach_user: dict = Depends(get_coach_user)):
    # Get clients who have booked with this coach
    total_clients = await db.bookings.distinct("client_id", {"coach_id": coach_user["_id"]})
    total_bookings = await db.bookings.count_documents({"coach_id": coach_user["_id"]})
    total_revenue = await db.bookings.aggregate([
        {"$match": {"coach_id": coach_user["_id"], "payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]["total"] if total_revenue else 0
    
    return {
        "clients": len(total_clients),
        "bookings": total_bookings,
        "revenue": revenue
    }

@api_router.get("/coach/clients")
async def get_coach_clients(coach_user: dict = Depends(get_coach_user)):
    # Get all unique client IDs from bookings
    client_ids = await db.bookings.distinct("client_id", {"coach_id": coach_user["_id"]})
    
    clients = []
    for client_id in client_ids:
        client = await db.users.find_one({"_id": client_id})
        if client:
            clients.append({
                "id": client["_id"],
                "email": client["email"],
                "full_name": client["full_name"],
                "created_at": client["created_at"]
            })
    
    return clients

@api_router.get("/coach/bookings")
async def get_coach_bookings(coach_user: dict = Depends(get_coach_user)):
    bookings = await db.bookings.find({"coach_id": coach_user["_id"]}).sort("created_at", -1).to_list(1000)
    return [BookingResponse(**booking, id=booking["_id"]) for booking in bookings]

@api_router.get("/coach/my-trainees")
async def get_coach_trainees(coach_user: dict = Depends(get_coach_user)):
    # Get all clients who have booked with this coach
    client_ids = await db.bookings.distinct("client_id", {"coach_id": coach_user["_id"]})
    
    trainees = []
    for client_id in client_ids:
        client = await db.users.find_one({"_id": client_id})
        if client:
            # Get remaining hours
            bookings = await db.bookings.find({
                "client_id": client_id,
                "coach_id": coach_user["_id"],
                "payment_status": "completed"
            }).to_list(100)
            
            total_hours = sum(b.get("hours_purchased", 0) for b in bookings)
            used_hours = sum(b.get("hours_used", 0) for b in bookings)
            
            trainees.append({
                "id": client["_id"],
                "email": client["email"],
                "full_name": client["full_name"],
                "created_at": client["created_at"],
                "hours_remaining": total_hours - used_hours
            })
    
    return trainees

@api_router.get("/coach/subscription")
async def get_coach_subscription(coach_user: dict = Depends(get_coach_user)):
    subscription = await db.subscriptions.find_one({"coach_id": coach_user["_id"]}, sort=[("created_at", -1)])
    if subscription:
        return {
            "id": subscription["_id"],
            "plan": subscription["plan"],
            "status": subscription["status"],
            "start_date": subscription["start_date"],
            "end_date": subscription["end_date"],
            "amount": subscription["amount"]
        }
    return None

@api_router.post("/coach/subscribe")
async def subscribe_coach(data: dict, coach_user: dict = Depends(get_coach_user)):
    plan = data.get("plan", "monthly")
    
    # Calculate dates and amount
    from datetime import datetime, timedelta
    start_date = datetime.utcnow()
    if plan == "yearly":
        end_date = start_date + timedelta(days=365)
        amount = 399
    else:
        end_date = start_date + timedelta(days=30)
        amount = 49
    
    subscription = {
        "_id": str(uuid.uuid4()),
        "coach_id": coach_user["_id"],
        "plan": plan,
        "status": "active",
        "start_date": start_date,
        "end_date": end_date,
        "amount": amount,
        "created_at": datetime.utcnow()
    }
    
    await db.subscriptions.insert_one(subscription)
    
    # Update coach profile to be active
    await db.coach_profiles.update_one(
        {"user_id": coach_user["_id"]},
        {"$set": {"is_active": True}},
        upsert=True
    )
    
    return {"message": "Subscription activated", "subscription_id": subscription["_id"]}

# ==================== PUBLIC COACHES LIST ====================

@api_router.get("/coaches")
async def get_public_coaches():
    # Get all active coach profiles
    coach_profiles = await db.coach_profiles.find({"is_active": True}).to_list(100)
    
    coaches = []
    for profile in coach_profiles:
        user = await db.users.find_one({"_id": profile["user_id"]})
        if user:
            # Get average rating
            reviews = await db.reviews.find({"coach_id": profile["user_id"]}).to_list(1000)
            avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
            
            coaches.append({
                "id": user["_id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "bio": profile.get("bio", ""),
                "specialties": profile.get("specialties", []),
                "rating": round(avg_rating, 1),
                "reviews_count": len(reviews),
                "hourly_rate": profile.get("hourly_rate", 50),
                "is_active": profile.get("is_active", False),
                "profile_image": profile.get("profile_image")
            })
    
    return coaches

@api_router.get("/coaches/{coach_id}")
async def get_coach_profile(coach_id: str):
    user = await db.users.find_one({"_id": coach_id, "role": "coach"})
    if not user:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    profile = await db.coach_profiles.find_one({"user_id": coach_id})
    reviews = await db.reviews.find({"coach_id": coach_id}).sort("created_at", -1).to_list(100)
    
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "id": user["_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "bio": profile.get("bio", "") if profile else "",
        "specialties": profile.get("specialties", []) if profile else [],
        "rating": round(avg_rating, 1),
        "reviews_count": len(reviews),
        "hourly_rate": profile.get("hourly_rate", 50) if profile else 50,
        "reviews": [
            {
                "id": r["_id"],
                "rating": r["rating"],
                "comment": r.get("comment", ""),
                "client_name": r.get("client_name", "متدرب"),
                "created_at": r["created_at"]
            }
            for r in reviews[:20]
        ]
    }

@api_router.post("/coaches/{coach_id}/review")
async def add_coach_review(coach_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can add reviews")
    
    review = {
        "_id": str(uuid.uuid4()),
        "coach_id": coach_id,
        "client_id": current_user["_id"],
        "client_name": current_user["full_name"],
        "rating": data.get("rating", 5),
        "comment": data.get("comment", ""),
        "created_at": datetime.utcnow()
    }
    
    await db.reviews.insert_one(review)
    return {"message": "Review added", "review_id": review["_id"]}

@api_router.put("/coach/profile")
async def update_coach_profile(data: dict, coach_user: dict = Depends(get_coach_user)):
    update_data = {
        "user_id": coach_user["_id"],
        "bio": data.get("bio", ""),
        "specialties": data.get("specialties", []),
        "hourly_rate": data.get("hourly_rate", 50),
        "updated_at": datetime.utcnow()
    }
    
    await db.coach_profiles.update_one(
        {"user_id": coach_user["_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Profile updated"}

# ==================== SOCKET.IO EVENTS ====================

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join(sid, data):
    user_id = data.get('user_id')
    if user_id:
        await sio.enter_room(sid, user_id)
        logger.info(f"User {user_id} joined room")

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Ask Yazo API", "version": "1.0", "domain": "askyazo.com"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
