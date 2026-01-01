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
    total_revenue = await db.bookings.aggregate([
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]["total"] if total_revenue else 0
    
    return {
        "total_users": total_users,
        "coaches": total_coaches,
        "total_bookings": total_bookings,
        "total_revenue": revenue
    }

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
