from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
import stripe
import socketio
import httpx

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
import certifi
mongo_url = os.environ['MONGO_URL']
# Use certifi only for Atlas connections (mongodb+srv)
if 'mongodb+srv' in mongo_url:
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
else:
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

# ==================== USER RESULTS MODELS ====================

class SavedResult(BaseModel):
    id: Optional[str] = None
    user_id: str
    calculator_name: str
    calculator_type: str  # bmi, tdee, calories, etc.
    pillar: str  # physical, mental, social, spiritual
    inputs: Dict[str, Any]
    result_value: Any
    result_text: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaveResultRequest(BaseModel):
    calculator_name: str
    calculator_type: str
    pillar: str
    inputs: Dict[str, Any]
    result_value: Any
    result_text: str

class UserProfileData(BaseModel):
    user_id: str
    full_name: str
    email: str
    saved_results: List[Dict[str, Any]]
    intake_questionnaire: Optional[Dict[str, Any]]
    habit_tracker: List[Dict[str, Any]]
    bookings: List[Dict[str, Any]]

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
    sender_id: Optional[str] = None  # Will be set from token
    recipient_id: str
    message: str
    attachment: Optional[str] = None  # base64 encoded file
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

# ==================== Google Auth Models ====================

class GoogleSessionRequest(BaseModel):
    session_id: str

class GoogleSessionResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class GoogleUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    picture: Optional[str] = None
    created_at: datetime

class GoogleTokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: GoogleUserResponse

class IntakeQuestionnaireResponse(BaseModel):
    user_id: str
    responses: Dict[str, Any]  # Questions and answers
    pillars_assessment: Dict[str, int]  # Physical, Diet, Mental, Spiritual scores
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Resource(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    category: str  # wellness, mindset, productivity, relationships
    content_type: str  # article, video, audio, pdf
    content: Optional[str] = None  # المحتوى النصي للمقالات
    external_url: Optional[str] = None  # رابط خارجي (يوتيوب، إلخ)
    internal_route: Optional[str] = None  # مسار داخلي في التطبيق
    duration: Optional[str] = None  # مدة القراءة/المشاهدة
    icon: str = "document-text"
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResourceCreate(BaseModel):
    title: str
    description: str
    category: str
    content_type: str
    content: Optional[str] = None
    external_url: Optional[str] = None
    internal_route: Optional[str] = None
    duration: Optional[str] = None
    icon: str = "document-text"
    is_active: bool = True

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[str] = None
    external_url: Optional[str] = None
    internal_route: Optional[str] = None
    duration: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

# ==================== CUSTOM CALCULATORS ====================

class CustomCalculator(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    category: str  # physical, nutritional, mental, spiritual
    icon: str = "calculator"
    html_content: str  # كود HTML/CSS/JavaScript
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CustomCalculatorCreate(BaseModel):
    title: str
    description: str
    category: str
    icon: str = "calculator"
    html_content: str
    is_active: bool = True

class CustomCalculatorUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    html_content: Optional[str] = None
    is_active: Optional[bool] = None

class HabitTracker(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD
    habits_completed: List[str]
    notes: Optional[str] = None

class SessionCreate(BaseModel):
    booking_id: str
    duration_hours: float
    session_type: str  # training, consultation, etc.
    notes: Optional[str] = None
    session_date: datetime = Field(default_factory=datetime.utcnow)

class SessionResponse(BaseModel):
    id: str
    booking_id: str
    coach_id: str
    client_id: str
    duration_hours: float
    session_type: str
    notes: Optional[str] = None
    session_date: datetime
    created_at: datetime

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

async def get_coach_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["coach", "admin"]:
        raise HTTPException(status_code=403, detail="Coach access required")
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
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Try both password field names for compatibility
    password_hash = user.get("password_hash") or user.get("hashed_password")
    if not password_hash or not verify_password(credentials.password, password_hash):
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

# ==================== Google Auth ENDPOINTS ====================

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

@api_router.post("/auth/google", response_model=GoogleTokenResponse)
async def google_auth(session_request: GoogleSessionRequest):
    """Exchange Emergent session_id for user data and create/login user"""
    try:
        # Get user data from Emergent Auth
        async with httpx.AsyncClient() as client:
            response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_request.session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            google_data = response.json()
        
        # Check if user exists by email
        existing_user = await db.users.find_one({"email": google_data["email"]})
        
        if existing_user:
            # User exists - login
            user_id = existing_user["_id"]
            user_dict = existing_user
        else:
            # New user - register
            user_id = str(uuid.uuid4())
            user_dict = {
                "_id": user_id,
                "email": google_data["email"],
                "full_name": google_data.get("name", google_data["email"].split("@")[0]),
                "picture": google_data.get("picture"),
                "role": "client",  # Default role for new Google users
                "auth_provider": "google",
                "google_id": google_data.get("id"),
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_dict)
        
        # Store session in database
        session_token = google_data.get("session_token", str(uuid.uuid4()))
        await db.user_sessions.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create JWT token for app use
        access_token = create_access_token(data={"sub": user_id})
        
        user_response = GoogleUserResponse(
            id=user_id,
            email=user_dict["email"],
            full_name=user_dict.get("full_name", user_dict["email"].split("@")[0]),
            role=user_dict.get("role", "client"),
            picture=user_dict.get("picture"),
            created_at=user_dict.get("created_at", datetime.now(timezone.utc))
        )
        
        return GoogleTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except httpx.RequestError as e:
        logger.error(f"Error contacting Emergent Auth: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CALCULATOR ENDPOINTS ====================

@api_router.post("/calculators/save")
async def save_calculator_history(calc_data: CalculatorHistory, current_user: dict = Depends(get_current_user)):
    calc_dict = calc_data.dict()
    calc_dict["_id"] = str(uuid.uuid4())
    await db.calculator_history.insert_one(calc_dict)
    return {"message": "Calculator history saved", "id": calc_dict["_id"]}

# ==================== USER RESULTS ENDPOINTS (حفظ نتائج المتدرب) ====================

async def check_user_has_subscription(user_id: str) -> bool:
    """التحقق من أن المتدرب لديه اشتراك/حجز مؤكد"""
    booking = await db.bookings.find_one({
        "client_id": user_id,
        "booking_status": {"$in": ["confirmed", "active", "completed"]}
    })
    return booking is not None

@api_router.post("/user-results/save")
async def save_user_result(result_data: SaveResultRequest, current_user: dict = Depends(get_current_user)):
    """حفظ نتيجة حاسبة - متاح فقط للمشتركين"""
    user_id = current_user["_id"]
    
    # التحقق من الاشتراك
    has_subscription = await check_user_has_subscription(user_id)
    if not has_subscription and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403, 
            detail="هذه الميزة متاحة للمشتركين فقط. قم بحجز باقة للاستفادة من حفظ النتائج."
        )
    
    result_dict = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "calculator_name": result_data.calculator_name,
        "calculator_type": result_data.calculator_type,
        "pillar": result_data.pillar,
        "inputs": result_data.inputs,
        "result_value": result_data.result_value,
        "result_text": result_data.result_text,
        "saved_at": datetime.now(timezone.utc)
    }
    
    await db.user_results.insert_one(result_dict)
    return {"message": "تم حفظ النتيجة بنجاح", "id": result_dict["_id"]}

@api_router.get("/user-results/my-results")
async def get_my_results(current_user: dict = Depends(get_current_user)):
    """الحصول على نتائج المتدرب الحالي"""
    results = await db.user_results.find({"user_id": current_user["_id"]}).sort("saved_at", -1).to_list(1000)
    
    # تنظيم النتائج حسب الركيزة
    organized = {
        "physical": [],
        "mental": [],
        "social": [],
        "spiritual": []
    }
    
    for r in results:
        r["id"] = r.pop("_id")
        pillar = r.get("pillar", "physical")
        if pillar in organized:
            organized[pillar].append(r)
    
    return organized

@api_router.get("/user-results/trainee/{trainee_id}")
async def get_trainee_results(trainee_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على نتائج متدرب معين - متاح للمدرب فقط"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    results = await db.user_results.find({"user_id": trainee_id}).sort("saved_at", -1).to_list(1000)
    
    organized = {
        "physical": [],
        "mental": [],
        "social": [],
        "spiritual": []
    }
    
    for r in results:
        r["id"] = r.pop("_id")
        pillar = r.get("pillar", "physical")
        if pillar in organized:
            organized[pillar].append(r)
    
    return organized

@api_router.delete("/user-results/{result_id}")
async def delete_user_result(result_id: str, current_user: dict = Depends(get_current_user)):
    """حذف نتيجة محفوظة"""
    result = await db.user_results.find_one({"_id": result_id})
    if not result:
        raise HTTPException(status_code=404, detail="النتيجة غير موجودة")
    
    if result["user_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    await db.user_results.delete_one({"_id": result_id})
    return {"message": "تم حذف النتيجة"}

@api_router.get("/user-profile/check-subscription")
async def check_subscription_status(current_user: dict = Depends(get_current_user)):
    """التحقق من حالة اشتراك المتدرب"""
    has_subscription = await check_user_has_subscription(current_user["_id"])
    return {"has_subscription": has_subscription}

@api_router.get("/user-profile/{user_id}")
async def get_user_profile_data(user_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على الملف الشخصي الكامل للمتدرب"""
    # التحقق من الصلاحيات
    if current_user["_id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # بيانات المستخدم
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # النتائج المحفوظة
    results = await db.user_results.find({"user_id": user_id}).sort("saved_at", -1).to_list(1000)
    for r in results:
        r["id"] = r.pop("_id")
    
    # استبيان القبول
    intake = await db.intake_questionnaire.find_one({"user_id": user_id})
    if intake:
        intake["id"] = intake.pop("_id")
    
    # متتبع العادات
    habits = await db.habit_tracker.find({"user_id": user_id}).sort("date", -1).to_list(100)
    for h in habits:
        h["id"] = h.pop("_id")
    
    # الحجوزات
    bookings = await db.bookings.find({"user_id": user_id}).to_list(100)
    for b in bookings:
        b["id"] = b.pop("_id")
    
    return {
        "user_id": user_id,
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "created_at": user.get("created_at"),
        "saved_results": results,
        "intake_questionnaire": intake,
        "habit_tracker": habits,
        "bookings": bookings
    }

@api_router.get("/coach/trainees-profiles")
async def get_all_trainees_profiles(current_user: dict = Depends(get_current_user)):
    """الحصول على قائمة المتدربين مع ملخص بياناتهم - للمدرب فقط"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    # الحصول على جميع المتدربين الذين لديهم حجوزات
    bookings = await db.bookings.find({"booking_status": {"$in": ["confirmed", "active", "completed"]}}).to_list(1000)
    trainee_ids = list(set([b["client_id"] for b in bookings]))
    
    trainees_data = []
    for trainee_id in trainee_ids:
        user = await db.users.find_one({"_id": trainee_id})
        if user:
            results_count = await db.user_results.count_documents({"user_id": trainee_id})
            has_intake = await db.intake_questionnaire.count_documents({"user_id": trainee_id}) > 0
            
            trainees_data.append({
                "user_id": trainee_id,
                "full_name": user.get("full_name", ""),
                "email": user.get("email", ""),
                "results_count": results_count,
                "has_intake": has_intake,
                "created_at": user.get("created_at")
            })
    
    return trainees_data

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
    # Try to delete from hourly_packages first
    result = await db.hourly_packages.delete_one({"_id": package_id})
    if result.deleted_count == 0:
        # Try coach_packages
        result = await db.coach_packages.delete_one({"_id": package_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    
    return {"message": "Package deleted"}

# ==================== BOOKING & PAYMENT ENDPOINTS ====================

@api_router.post("/bookings/create")
async def create_booking(booking: dict, current_user: dict = Depends(get_current_user)):
    # Get package details - check both collections
    package = await db.hourly_packages.find_one({"_id": booking.get("package_id")})
    if not package:
        # Try coach_packages collection
        package = await db.coach_packages.find_one({"_id": booking.get("package_id")})
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # في النموذج الجديد: جميع الحجوزات تكون مع يازو (الأدمن)
    # نبحث عن الأدمن تلقائياً
    admin_user = await db.users.find_one({"role": "admin"})
    coach_id = admin_user["_id"] if admin_user else booking.get("coach_id") or package.get("coach_id")
    coach_name = admin_user.get("full_name", "يازو") if admin_user else "يازو"
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking_dict = {
        "_id": booking_id,
        "client_id": current_user["_id"],
        "client_name": current_user.get("full_name", "متدرب"),
        "coach_id": coach_id,
        "coach_name": coach_name,
        "package_id": booking.get("package_id"),
        "package_name": package.get("name"),
        "hours_purchased": package.get("hours"),
        "hours_used": 0,
        "amount": package.get("price"),
        "payment_status": "pending",
        "booking_status": "pending",
        "notes": booking.get("notes", ""),
        "scheduled_date": booking.get("scheduled_date"),
        "created_at": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_dict)
    
    return {"message": "Booking created", "booking_id": booking_id}

@api_router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id, "client_id": current_user["_id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update booking status
    await db.bookings.update_one(
        {"_id": booking_id},
        {"$set": {"payment_status": "completed", "booking_status": "confirmed"}}
    )
    
    return {"message": "Booking confirmed"}

@api_router.get("/bookings/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"client_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    
    # Enrich with coach info
    result = []
    for booking in bookings:
        coach = await db.users.find_one({"_id": booking.get("coach_id")})
        result.append({
            "id": booking["_id"],
            "coach_id": booking.get("coach_id"),
            "coach_name": coach.get("full_name") if coach else "مدرب",
            "package_name": booking.get("package_name"),
            "hours_purchased": booking.get("hours_purchased"),
            "hours_used": booking.get("hours_used", 0),
            "amount": booking.get("amount"),
            "payment_status": booking.get("payment_status"),
            "booking_status": booking.get("booking_status"),
            "notes": booking.get("notes"),
            "created_at": booking.get("created_at")
        })
    
    return result

@api_router.get("/coach/my-clients")
async def get_coach_clients(coach_user: dict = Depends(get_coach_user)):
    # للأدمن: عرض جميع الحجوزات
    # للمدرب العادي: عرض حجوزاته فقط
    if coach_user.get("role") == "admin":
        bookings = await db.bookings.find().sort("created_at", -1).to_list(100)
    else:
        bookings = await db.bookings.find({"coach_id": coach_user["_id"]}).sort("created_at", -1).to_list(100)
    
    # Enrich with client info
    result = []
    for booking in bookings:
        client = await db.users.find_one({"_id": booking.get("client_id")})
        result.append({
            "id": booking["_id"],
            "client_id": booking.get("client_id"),
            "client_name": client.get("full_name") if client else booking.get("client_name", "متدرب"),
            "package_name": booking.get("package_name"),
            "hours_purchased": booking.get("hours_purchased"),
            "hours_used": booking.get("hours_used", 0),
            "amount": booking.get("amount"),
            "payment_status": booking.get("payment_status"),
            "booking_status": booking.get("booking_status"),
            "notes": booking.get("notes"),
            "created_at": booking.get("created_at")
        })
    
    return result

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, data: dict, coach_user: dict = Depends(get_coach_user)):
    # للأدمن: يمكنه تحديث أي حجز
    if coach_user.get("role") == "admin":
        booking = await db.bookings.find_one({"_id": booking_id})
    else:
        booking = await db.bookings.find_one({"_id": booking_id, "coach_id": coach_user["_id"]})
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update = {}
    if "booking_status" in data:
        update["booking_status"] = data["booking_status"]
        # عند تأكيد الحجز، نضع الدفع كمكتمل أيضاً
        if data["booking_status"] == "confirmed":
            update["payment_status"] = "completed"
    if "payment_status" in data:
        update["payment_status"] = data["payment_status"]
    if "hours_used" in data:
        update["hours_used"] = data["hours_used"]
    
    if update:
        await db.bookings.update_one({"_id": booking_id}, {"$set": update})
    
    return {"message": "Booking updated"}

@api_router.get("/bookings/all", response_model=List[BookingResponse])
async def get_all_bookings(admin_user: dict = Depends(get_admin_user)):
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [BookingResponse(**booking, id=booking["_id"]) for booking in bookings]

# ==================== SESSION TRACKING ENDPOINTS ====================

@api_router.post("/sessions/create")
async def create_session(session_data: SessionCreate, coach_user: dict = Depends(get_coach_user)):
    """Create a new training session"""
    # للأدمن: يمكنه إنشاء جلسة لأي حجز
    if coach_user.get("role") == "admin":
        booking = await db.bookings.find_one({"_id": session_data.booking_id})
    else:
        booking = await db.bookings.find_one({"_id": session_data.booking_id, "coach_id": coach_user["_id"]})
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create session record
    session_id = str(uuid.uuid4())
    session_dict = {
        "_id": session_id,
        "booking_id": session_data.booking_id,
        "coach_id": coach_user["_id"],
        "client_id": booking["client_id"],
        "duration_hours": session_data.duration_hours,
        "session_type": session_data.session_type,
        "notes": session_data.notes,
        "session_date": session_data.session_date,
        "created_at": datetime.utcnow()
    }
    
    await db.sessions.insert_one(session_dict)
    
    # Update booking hours used
    current_hours_used = booking.get("hours_used", 0)
    new_hours_used = current_hours_used + session_data.duration_hours
    
    await db.bookings.update_one(
        {"_id": session_data.booking_id},
        {"$set": {"hours_used": new_hours_used}}
    )
    
    return {"message": "Session created", "session_id": session_id}

@api_router.get("/sessions/my-sessions")
async def get_coach_sessions(coach_user: dict = Depends(get_coach_user)):
    """Get all sessions for the coach"""
    # للأدمن: عرض جميع الجلسات
    if coach_user.get("role") == "admin":
        sessions = await db.sessions.find().sort("session_date", -1).to_list(1000)
    else:
        sessions = await db.sessions.find({"coach_id": coach_user["_id"]}).sort("session_date", -1).to_list(1000)
    
    result = []
    for session in sessions:
        # Get client info
        client = await db.users.find_one({"_id": session["client_id"]})
        booking = await db.bookings.find_one({"_id": session["booking_id"]})
        
        result.append({
            "id": session["_id"],
            "booking_id": session["booking_id"],
            "client_name": client.get("full_name") if client else "متدرب",
            "package_name": booking.get("package_name") if booking else "",
            "duration_hours": session["duration_hours"],
            "session_type": session["session_type"],
            "notes": session.get("notes"),
            "session_date": session["session_date"],
            "created_at": session["created_at"]
        })
    
    return result

@api_router.get("/sessions/client-sessions")
async def get_client_sessions(current_user: dict = Depends(get_current_user)):
    """Get all sessions for the client"""
    sessions = await db.sessions.find({"client_id": current_user["_id"]}).sort("session_date", -1).to_list(1000)
    
    result = []
    for session in sessions:
        # Get coach info
        coach = await db.users.find_one({"_id": session["coach_id"]})
        booking = await db.bookings.find_one({"_id": session["booking_id"]})
        
        result.append({
            "id": session["_id"],
            "booking_id": session["booking_id"],
            "coach_name": coach.get("full_name") if coach else "مدرب",
            "package_name": booking.get("package_name") if booking else "",
            "duration_hours": session["duration_hours"],
            "session_type": session["session_type"],
            "notes": session.get("notes"),
            "session_date": session["session_date"],
            "created_at": session["created_at"]
        })
    
    return result

@api_router.put("/sessions/{session_id}")
async def update_session(session_id: str, data: dict, coach_user: dict = Depends(get_coach_user)):
    """Update a session"""
    session = await db.sessions.find_one({"_id": session_id, "coach_id": coach_user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = {}
    if "duration_hours" in data:
        # If duration changed, update booking hours
        old_duration = session["duration_hours"]
        new_duration = data["duration_hours"]
        duration_diff = new_duration - old_duration
        
        booking = await db.bookings.find_one({"_id": session["booking_id"]})
        if booking:
            new_hours_used = booking.get("hours_used", 0) + duration_diff
            await db.bookings.update_one(
                {"_id": session["booking_id"]},
                {"$set": {"hours_used": new_hours_used}}
            )
        
        update_data["duration_hours"] = new_duration
    
    if "session_type" in data:
        update_data["session_type"] = data["session_type"]
    if "notes" in data:
        update_data["notes"] = data["notes"]
    if "session_date" in data:
        update_data["session_date"] = data["session_date"]
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.sessions.update_one({"_id": session_id}, {"$set": update_data})
    
    return {"message": "Session updated"}

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, coach_user: dict = Depends(get_coach_user)):
    """Delete a session"""
    # للأدمن: يمكنه حذف أي جلسة
    # للمدرب: يمكنه حذف جلساته فقط
    if coach_user["role"] == "admin":
        session = await db.sessions.find_one({"_id": session_id})
    else:
        session = await db.sessions.find_one({"_id": session_id, "coach_id": coach_user["_id"]})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update booking hours (subtract the session duration)
    booking = await db.bookings.find_one({"_id": session["booking_id"]})
    if booking:
        new_hours_used = max(0, booking.get("hours_used", 0) - session.get("duration_hours", 0))
        await db.bookings.update_one(
            {"_id": session["booking_id"]},
            {"$set": {"hours_used": new_hours_used}}
        )
    
    await db.sessions.delete_one({"_id": session_id})
    return {"message": "Session deleted"}

@api_router.get("/sessions/stats")
async def get_session_stats(coach_user: dict = Depends(get_coach_user)):
    """Get session statistics for coach"""
    # Total sessions
    total_sessions = await db.sessions.count_documents({"coach_id": coach_user["_id"]})
    
    # Total hours conducted
    sessions = await db.sessions.find({"coach_id": coach_user["_id"]}).to_list(1000)
    total_hours = sum(s.get("duration_hours", 0) for s in sessions)
    
    # This month's sessions
    from datetime import datetime
    first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_sessions = await db.sessions.count_documents({
        "coach_id": coach_user["_id"],
        "session_date": {"$gte": first_of_month}
    })
    
    # Active clients (clients with sessions this month)
    active_clients = await db.sessions.distinct("client_id", {
        "coach_id": coach_user["_id"],
        "session_date": {"$gte": first_of_month}
    })
    
    return {
        "total_sessions": total_sessions,
        "total_hours": total_hours,
        "monthly_sessions": monthly_sessions,
        "active_clients": len(active_clients)
    }

# ==================== MESSAGING ENDPOINTS ====================

@api_router.get("/messages/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get total count of unread messages for the current user"""
    unread_count = await db.messages.count_documents({
        "recipient_id": current_user["_id"],
        "read": False
    })
    return {"unread_count": unread_count}

@api_router.post("/messages/mark-read/{sender_id}")
async def mark_messages_as_read(sender_id: str, current_user: dict = Depends(get_current_user)):
    """Mark all messages from a sender as read"""
    result = await db.messages.update_many(
        {
            "sender_id": sender_id,
            "recipient_id": current_user["_id"],
            "read": False
        },
        {"$set": {"read": True}}
    )
    return {"marked_count": result.modified_count}

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
            
            # Get profile image
            profile_image = user.get("profile_image")
            if not profile_image:
                coach_profile = await db.coach_profiles.find_one({"user_id": user_id})
                if coach_profile:
                    profile_image = coach_profile.get("profile_image")
            
            conversations.append({
                "user_id": user_id,
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user.get("role", "client"),
                "profile_image": profile_image,
                "last_message": last_message.get("message", "") if last_message else "",
                "last_message_time": last_message.get("timestamp") if last_message else None,
                "unread_count": unread_count
            })
    
    return conversations

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

@api_router.get("/chat/available-contacts")
async def get_available_chat_contacts(current_user: dict = Depends(get_current_user)):
    """
    نظام محادثات مبسط:
    - المتدربين يتحدثون مع يازو (أي أدمن)
    - يازو يرى جميع المتدربين
    """
    contacts = []
    
    if current_user["role"] in ["client", "trainee"]:
        # المتدرب: يرى يازو (جميع الأدمن)
        admins = await db.users.find({"role": "admin"}).to_list(10)
        
        for admin in admins:
            # Get last message
            last_message = await db.messages.find_one({
                "$or": [
                    {"sender_id": current_user["_id"], "recipient_id": admin["_id"]},
                    {"sender_id": admin["_id"], "recipient_id": current_user["_id"]}
                ]
            }, sort=[("timestamp", -1)])
            
            # Count unread messages
            unread_count = await db.messages.count_documents({
                "sender_id": admin["_id"],
                "recipient_id": current_user["_id"],
                "read": False
            })
            
            contacts.append({
                "user_id": admin["_id"],
                "full_name": admin.get("full_name", "يازو"),
                "role": "coach",
                "profile_image": admin.get("profile_image"),
                "specialties": ["تدريب حياة شامل"],
                "last_message": last_message.get("message", "") if last_message else "",
                "last_message_time": last_message.get("timestamp") if last_message else None,
                "unread_count": unread_count,
                "booking_status": "active",
                "package_name": "",
                "hours_remaining": 0
            })
    
    elif current_user["role"] in ["coach", "admin"]:
        # يازو/المدرب: يرى جميع المتدربين (client و trainee)
        trainees = await db.users.find({"role": {"$in": ["client", "trainee"]}}).to_list(100)
        
        for trainee in trainees:
            # Get last message
            last_message = await db.messages.find_one({
                "$or": [
                    {"sender_id": current_user["_id"], "recipient_id": trainee["_id"]},
                    {"sender_id": trainee["_id"], "recipient_id": current_user["_id"]}
                ]
            }, sort=[("timestamp", -1)])
            
            # Count unread messages
            unread_count = await db.messages.count_documents({
                "sender_id": trainee["_id"],
                "recipient_id": current_user["_id"],
                "read": False
            })
            
            # Get booking info if exists
            booking = await db.bookings.find_one({"client_id": trainee["_id"]})
            hours_remaining = 0
            package_name = ""
            if booking:
                hours_remaining = booking.get("hours_purchased", 0) - booking.get("hours_used", 0)
                package_name = booking.get("package_name", "")
            
            contacts.append({
                "user_id": trainee["_id"],
                "full_name": trainee["full_name"],
                "role": "client",
                "profile_image": trainee.get("profile_image"),
                "last_message": last_message.get("message", "") if last_message else "",
                "last_message_time": last_message.get("timestamp") if last_message else None,
                "unread_count": unread_count,
                "hours_remaining": hours_remaining,
                "package_name": package_name,
                "booking_status": "active" if booking else "no_booking"
            })
    
    # Sort: unread first, then by last message time
    def sort_key(x):
        unread = -(x.get("unread_count") or 0)
        last_time = x.get("last_message_time")
        if last_time:
            if isinstance(last_time, str):
                return (unread, last_time)
            else:
                return (unread, last_time.isoformat())
        return (unread, "")
    
    contacts.sort(key=sort_key)
    
    return contacts

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

@api_router.get("/admin/bookings")
async def get_admin_bookings(admin_user: dict = Depends(get_admin_user)):
    """Get all bookings for admin"""
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    
    result = []
    for booking in bookings:
        result.append({
            "id": booking["_id"],
            "client_id": booking.get("client_id"),
            "client_name": booking.get("client_name", "غير محدد"),
            "coach_id": booking.get("coach_id"),
            "coach_name": booking.get("coach_name", "يازو"),
            "package_id": booking.get("package_id"),
            "package_name": booking.get("package_name", ""),
            "hours_purchased": booking.get("hours_purchased", 0),
            "hours_used": booking.get("hours_used", 0),
            "amount": booking.get("amount", 0),
            "payment_status": booking.get("payment_status", "pending"),
            "booking_status": booking.get("booking_status", "pending"),
            "notes": booking.get("notes", ""),
            "created_at": booking.get("created_at")
        })
    
    return result

# ==================== ADMIN SUBSCRIPTION MANAGEMENT ====================

# ==================== ADMIN PAYMENT MANAGEMENT ====================

@api_router.get("/admin/payments")
async def get_all_payments(admin_user: dict = Depends(get_admin_user)):
    """Get all payments with user details"""
    payments = await db.payments.find().sort("created_at", -1).to_list(1000)
    
    result = []
    for payment in payments:
        user = await db.users.find_one({"_id": payment.get("user_id")})
        
        result.append({
            "id": payment["_id"],
            "user_id": payment.get("user_id"),
            "user_name": user["full_name"] if user else "غير معروف",
            "user_email": user["email"] if user else "",
            "type": payment.get("type", "booking"),  # booking or subscription
            "amount": payment.get("amount", 0),
            "status": payment.get("status", "pending"),
            "payment_method": payment.get("payment_method", "stripe"),
            "stripe_payment_intent_id": payment.get("stripe_payment_intent_id"),
            "booking_id": payment.get("booking_id"),
            "plan": payment.get("plan"),
            "created_at": payment.get("created_at"),
        })
    
    return result

@api_router.get("/admin/payments/stats")
async def get_payment_stats(admin_user: dict = Depends(get_admin_user)):
    """Get payment statistics"""
    # Total revenue from bookings
    booking_revenue = await db.payments.aggregate([
        {"$match": {"type": "booking", "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # Total revenue from subscriptions
    subscription_revenue = await db.payments.aggregate([
        {"$match": {"type": "subscription", "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # This month's revenue
    from datetime import datetime
    first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = await db.payments.aggregate([
        {"$match": {"status": "completed", "created_at": {"$gte": first_of_month}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # Today's revenue
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_revenue = await db.payments.aggregate([
        {"$match": {"status": "completed", "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # Count by status
    total_payments = await db.payments.count_documents({})
    completed_payments = await db.payments.count_documents({"status": "completed"})
    pending_payments = await db.payments.count_documents({"status": "pending"})
    failed_payments = await db.payments.count_documents({"status": "failed"})
    
    # Revenue by coach
    coach_revenues = await db.bookings.aggregate([
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": "$coach_id", "total": {"$sum": "$amount"}}}
    ]).to_list(100)
    
    coach_details = []
    for cr in coach_revenues:
        coach = await db.users.find_one({"_id": cr["_id"]})
        if coach:
            coach_details.append({
                "coach_id": cr["_id"],
                "coach_name": coach["full_name"],
                "total_revenue": cr["total"]
            })
    
    return {
        "total_revenue": (booking_revenue[0]["total"] if booking_revenue else 0) + (subscription_revenue[0]["total"] if subscription_revenue else 0),
        "booking_revenue": booking_revenue[0]["total"] if booking_revenue else 0,
        "subscription_revenue": subscription_revenue[0]["total"] if subscription_revenue else 0,
        "monthly_revenue": monthly_revenue[0]["total"] if monthly_revenue else 0,
        "today_revenue": today_revenue[0]["total"] if today_revenue else 0,
        "total_payments": total_payments,
        "completed_payments": completed_payments,
        "pending_payments": pending_payments,
        "failed_payments": failed_payments,
        "coach_revenues": coach_details
    }

@api_router.get("/admin/payments/coach/{coach_id}")
async def get_coach_payments(coach_id: str, admin_user: dict = Depends(get_admin_user)):
    """Get payments for a specific coach"""
    # Get bookings for this coach
    bookings = await db.bookings.find({"coach_id": coach_id}).sort("created_at", -1).to_list(1000)
    
    coach = await db.users.find_one({"_id": coach_id})
    
    result = []
    for booking in bookings:
        client = await db.users.find_one({"_id": booking.get("client_id")})
        result.append({
            "id": booking["_id"],
            "client_name": client["full_name"] if client else "غير معروف",
            "package_name": booking.get("package_name"),
            "amount": booking.get("amount"),
            "payment_status": booking.get("payment_status", "pending"),
            "booking_status": booking.get("booking_status", "pending"),
            "created_at": booking.get("created_at"),
        })
    
    # Calculate totals
    total_earned = sum(b.get("amount", 0) for b in bookings if b.get("payment_status") == "completed")
    pending_amount = sum(b.get("amount", 0) for b in bookings if b.get("payment_status") == "pending")
    
    return {
        "coach_id": coach_id,
        "coach_name": coach["full_name"] if coach else "غير معروف",
        "total_earned": total_earned,
        "pending_amount": pending_amount,
        "transactions": result
    }

@api_router.post("/admin/payments/record-manual")
async def record_manual_payment(data: dict, admin_user: dict = Depends(get_admin_user)):
    """Record a manual payment"""
    payment = {
        "_id": str(uuid.uuid4()),
        "user_id": data.get("user_id"),
        "type": data.get("type", "booking"),
        "amount": data.get("amount"),
        "status": "completed",
        "payment_method": "manual",
        "booking_id": data.get("booking_id"),
        "notes": data.get("notes", ""),
        "recorded_by": admin_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment)
    
    # If linked to a booking, update booking status
    if data.get("booking_id"):
        await db.bookings.update_one(
            {"_id": data["booking_id"]},
            {"$set": {"payment_status": "completed"}}
        )
    
    return {"message": "Payment recorded", "id": payment["_id"]}

@api_router.post("/admin/payments/refund/{payment_id}")
async def process_refund(payment_id: str, data: dict, admin_user: dict = Depends(get_admin_user)):
    """Process a refund"""
    payment = await db.payments.find_one({"_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Record refund
    refund = {
        "_id": str(uuid.uuid4()),
        "original_payment_id": payment_id,
        "user_id": payment.get("user_id"),
        "type": "refund",
        "amount": -data.get("amount", payment.get("amount")),
        "reason": data.get("reason", ""),
        "status": "completed",
        "processed_by": admin_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(refund)
    
    # Update original payment status
    await db.payments.update_one(
        {"_id": payment_id},
        {"$set": {"status": "refunded"}}
    )
    
    return {"message": "Refund processed", "id": refund["_id"]}

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

@api_router.get("/coach/clients-list")
async def get_coach_clients_list(coach_user: dict = Depends(get_coach_user)):
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
    
    # Get profile image from profile or user
    profile_image = None
    if profile and profile.get("profile_image"):
        profile_image = profile.get("profile_image")
    elif user.get("profile_image"):
        profile_image = user.get("profile_image")
    
    return {
        "id": user["_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "bio": profile.get("bio", "") if profile else "",
        "specialties": profile.get("specialties", []) if profile else [],
        "rating": round(avg_rating, 1),
        "reviews_count": len(reviews),
        "hourly_rate": profile.get("hourly_rate", 50) if profile else 50,
        "profile_image": profile_image,
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

# Intake questionnaire
@api_router.post("/intake-questionnaire")
async def save_intake_questionnaire(data: dict, current_user: dict = Depends(get_current_user)):
    questionnaire = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "answers": data.get("answers", {}),
        "completed_at": datetime.utcnow()
    }
    
    await db.intake_questionnaires.update_one(
        {"user_id": current_user["_id"]},
        {"$set": questionnaire},
        upsert=True
    )
    
    return {"message": "Questionnaire saved"}

@api_router.get("/intake-questionnaire")
async def get_intake_questionnaire(current_user: dict = Depends(get_current_user)):
    questionnaire = await db.intake_questionnaires.find_one({"user_id": current_user["_id"]})
    if questionnaire:
        return {"completed": True, "answers": questionnaire.get("answers", {})}
    return {"completed": False, "answers": {}}

@api_router.put("/coach/profile")
async def update_coach_profile(data: dict, coach_user: dict = Depends(get_coach_user)):
    update_data = {
        "user_id": coach_user["_id"],
        "bio": data.get("bio", ""),
        "specialties": data.get("specialties", []),
        "hourly_rate": data.get("hourly_rate", 50),
        "profile_image": data.get("profile_image"),
        "updated_at": datetime.utcnow()
    }
    
    await db.coach_profiles.update_one(
        {"user_id": coach_user["_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    # Also update user's profile_image
    if data.get("profile_image") is not None:
        await db.users.update_one(
            {"_id": coach_user["_id"]},
            {"$set": {"profile_image": data.get("profile_image")}}
        )
    
    return {"message": "Profile updated"}

# ==================== HABIT TRACKER ENDPOINTS ====================

class HabitCreate(BaseModel):
    name: str
    icon: str
    color: str
    frequency: str = "daily"

class HabitToggle(BaseModel):
    date: str  # YYYY-MM-DD format

@api_router.get("/habits")
async def get_habits(current_user: dict = Depends(get_current_user)):
    """Get all habits for the current user"""
    habits = await db.habits.find({"user_id": current_user["_id"]}).to_list(100)
    
    # If no habits, create default ones
    if not habits:
        default_habits = [
            {"name": "شرب 8 أكواب ماء", "icon": "water", "color": "#2196F3"},
            {"name": "تمارين رياضية", "icon": "fitness", "color": "#4CAF50"},
            {"name": "قراءة 15 دقيقة", "icon": "book", "color": "#9C27B0"},
            {"name": "تأمل صباحي", "icon": "leaf", "color": "#8BC34A"},
        ]
        
        for habit in default_habits:
            habit_doc = {
                "_id": str(uuid.uuid4()),
                "user_id": current_user["_id"],
                "name": habit["name"],
                "icon": habit["icon"],
                "color": habit["color"],
                "frequency": "daily",
                "completed_dates": [],
                "created_at": datetime.utcnow()
            }
            await db.habits.insert_one(habit_doc)
        
        habits = await db.habits.find({"user_id": current_user["_id"]}).to_list(100)
    
    result = []
    for h in habits:
        result.append({
            "id": h["_id"],
            "name": h["name"],
            "icon": h["icon"],
            "color": h["color"],
            "frequency": h.get("frequency", "daily"),
            "completedDates": h.get("completed_dates", []),
            "createdAt": h.get("created_at", datetime.utcnow()).isoformat()
        })
    
    return result

@api_router.post("/habits")
async def create_habit(habit: HabitCreate, current_user: dict = Depends(get_current_user)):
    """Create a new habit"""
    habit_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "name": habit.name,
        "icon": habit.icon,
        "color": habit.color,
        "frequency": habit.frequency,
        "completed_dates": [],
        "created_at": datetime.utcnow()
    }
    
    await db.habits.insert_one(habit_doc)
    
    return {
        "id": habit_doc["_id"],
        "name": habit_doc["name"],
        "icon": habit_doc["icon"],
        "color": habit_doc["color"],
        "frequency": habit_doc["frequency"],
        "completedDates": [],
        "createdAt": habit_doc["created_at"].isoformat()
    }

@api_router.post("/habits/{habit_id}/toggle")
async def toggle_habit(habit_id: str, data: HabitToggle, current_user: dict = Depends(get_current_user)):
    """Toggle habit completion for a specific date"""
    habit = await db.habits.find_one({"_id": habit_id, "user_id": current_user["_id"]})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    completed_dates = habit.get("completed_dates", [])
    date_str = data.date
    
    if date_str in completed_dates:
        # Remove the date (uncomplete)
        completed_dates.remove(date_str)
        action = "uncompleted"
    else:
        # Add the date (complete)
        completed_dates.append(date_str)
        action = "completed"
    
    await db.habits.update_one(
        {"_id": habit_id},
        {"$set": {"completed_dates": completed_dates}}
    )
    
    return {
        "message": f"Habit {action}",
        "action": action,
        "completedDates": completed_dates
    }

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a habit"""
    result = await db.habits.delete_one({"_id": habit_id, "user_id": current_user["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    return {"message": "Habit deleted"}

@api_router.get("/habits/stats")
async def get_habit_stats(current_user: dict = Depends(get_current_user)):
    """Get habit statistics for the current user"""
    habits = await db.habits.find({"user_id": current_user["_id"]}).to_list(100)
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    total_habits = len(habits)
    completed_today = sum(1 for h in habits if today in h.get("completed_dates", []))
    
    # Calculate streaks
    total_streak = 0
    for habit in habits:
        streak = 0
        check_date = datetime.utcnow()
        for i in range(365):
            date_str = check_date.strftime("%Y-%m-%d")
            if date_str in habit.get("completed_dates", []):
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        total_streak = max(total_streak, streak)
    
    # Weekly completion rate
    week_completions = 0
    week_possible = total_habits * 7
    for i in range(7):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        for h in habits:
            if date in h.get("completed_dates", []):
                week_completions += 1
    
    weekly_rate = (week_completions / week_possible * 100) if week_possible > 0 else 0
    
    return {
        "total_habits": total_habits,
        "completed_today": completed_today,
        "today_progress": (completed_today / total_habits * 100) if total_habits > 0 else 0,
        "best_streak": total_streak,
        "weekly_rate": round(weekly_rate, 1)
    }

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

# ==================== STRIPE PAYMENT ENDPOINTS ====================

class CreatePaymentIntentRequest(BaseModel):
    package_id: str
    coach_id: str
    amount: int  # Amount in cents

class CreateSubscriptionRequest(BaseModel):
    price_id: str  # Stripe Price ID

@api_router.post("/payments/create-payment-intent")
async def create_payment_intent(data: CreatePaymentIntentRequest, current_user: dict = Depends(get_current_user)):
    """Create a PaymentIntent for trainee booking"""
    try:
        # Validate package exists
        package = await db.coach_packages.find_one({"_id": data.package_id})
        if not package:
            package = await db.hourly_packages.find_one({"_id": data.package_id})
        
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        
        # Verify amount matches package price (security check)
        expected_amount = int(package.get("price", 0) * 100)  # Convert to cents
        if data.amount != expected_amount:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        # Get or create Stripe customer for the trainee
        stripe_customer_id = current_user.get("stripe_customer_id")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=current_user.get("full_name", ""),
                metadata={"user_id": current_user["_id"]}
            )
            stripe_customer_id = customer.id
            
            # Save stripe customer id to user
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=data.amount,
            currency="usd",
            customer=stripe_customer_id,
            metadata={
                "user_id": current_user["_id"],
                "package_id": data.package_id,
                "coach_id": data.coach_id,
                "package_name": package.get("name", ""),
            },
            automatic_payment_methods={"enabled": True},
        )
        
        # Create ephemeral key for Payment Sheet
        ephemeral_key = stripe.EphemeralKey.create(
            customer=stripe_customer_id,
            stripe_version="2023-10-16"
        )
        
        return {
            "paymentIntent": payment_intent.client_secret,
            "ephemeralKey": ephemeral_key.secret,
            "customer": stripe_customer_id,
            "publishableKey": os.environ.get("STRIPE_PUBLISHABLE_KEY", ""),
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/payments/confirm-booking")
async def confirm_booking_payment(data: dict, current_user: dict = Depends(get_current_user)):
    """Confirm booking after successful payment"""
    try:
        payment_intent_id = data.get("payment_intent_id")
        package_id = data.get("package_id")
        coach_id = data.get("coach_id")
        notes = data.get("notes", "")
        
        # Verify payment with Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        # Get package info
        package = await db.coach_packages.find_one({"_id": package_id})
        if not package:
            package = await db.hourly_packages.find_one({"_id": package_id})
        
        if not package:
            raise HTTPException(status_code=404, detail="Package not found")
        
        # Create confirmed booking
        booking_id = str(uuid.uuid4())
        booking_dict = {
            "_id": booking_id,
            "client_id": current_user["_id"],
            "client_name": current_user.get("full_name", "متدرب"),
            "coach_id": coach_id,
            "package_id": package_id,
            "package_name": package.get("name"),
            "hours_purchased": package.get("hours", 0),
            "hours_used": 0,
            "amount": package.get("price"),
            "payment_method": "stripe",
            "payment_status": "completed",
            "booking_status": "confirmed",
            "stripe_payment_intent_id": payment_intent_id,
            "notes": notes,
            "created_at": datetime.utcnow()
        }
        
        await db.bookings.insert_one(booking_dict)
        
        # Record payment
        await db.payments.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "type": "booking",
            "booking_id": booking_id,
            "amount": package.get("price"),
            "stripe_payment_intent_id": payment_intent_id,
            "status": "completed",
            "created_at": datetime.utcnow()
        })
        
        return {"message": "Booking confirmed", "booking_id": booking_id}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== COACH SUBSCRIPTION ENDPOINTS ====================

# Subscription price IDs (would be configured in Stripe Dashboard)
SUBSCRIPTION_PRICES = {
    "monthly_basic": {
        "price_id": "price_monthly_basic",  # Replace with actual Stripe Price ID
        "amount": 2999,  # $29.99
        "name": "الاشتراك الشهري الأساسي"
    },
    "monthly_premium": {
        "price_id": "price_monthly_premium",  # Replace with actual Stripe Price ID
        "amount": 4999,  # $49.99
        "name": "الاشتراك الشهري المميز"
    }
}

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return list(SUBSCRIPTION_PRICES.values())

@api_router.post("/subscriptions/create-setup-intent")
async def create_subscription_setup(coach_user: dict = Depends(get_coach_user)):
    """Create setup intent for adding payment method for subscription"""
    try:
        # Get or create Stripe customer
        stripe_customer_id = coach_user.get("stripe_customer_id")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=coach_user["email"],
                name=coach_user.get("full_name", ""),
                metadata={"user_id": coach_user["_id"], "role": "coach"}
            )
            stripe_customer_id = customer.id
            
            await db.users.update_one(
                {"_id": coach_user["_id"]},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create SetupIntent for collecting payment method
        setup_intent = stripe.SetupIntent.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            metadata={"user_id": coach_user["_id"]}
        )
        
        # Create ephemeral key
        ephemeral_key = stripe.EphemeralKey.create(
            customer=stripe_customer_id,
            stripe_version="2023-10-16"
        )
        
        return {
            "setupIntent": setup_intent.client_secret,
            "ephemeralKey": ephemeral_key.secret,
            "customer": stripe_customer_id,
            "publishableKey": os.environ.get("STRIPE_PUBLISHABLE_KEY", ""),
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/subscriptions/activate")
async def activate_subscription(data: dict, coach_user: dict = Depends(get_coach_user)):
    """Activate subscription after payment method is set up"""
    try:
        plan_key = data.get("plan", "monthly_basic")
        
        if plan_key not in SUBSCRIPTION_PRICES:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        plan = SUBSCRIPTION_PRICES[plan_key]
        stripe_customer_id = coach_user.get("stripe_customer_id")
        
        if not stripe_customer_id:
            raise HTTPException(status_code=400, detail="No payment method set up")
        
        # Check if already has active subscription
        if coach_user.get("subscription_status") == "active":
            return {"message": "Subscription already active", "status": "active"}
        
        # For now, we'll simulate subscription activation
        # In production, you would create actual Stripe subscription
        
        # Update coach subscription status
        await db.users.update_one(
            {"_id": coach_user["_id"]},
            {
                "$set": {
                    "subscription_status": "active",
                    "subscription_plan": plan_key,
                    "subscription_amount": plan["amount"],
                    "subscription_start": datetime.utcnow(),
                    "subscription_updated": datetime.utcnow()
                }
            }
        )
        
        # Record subscription payment
        await db.payments.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": coach_user["_id"],
            "type": "subscription",
            "plan": plan_key,
            "amount": plan["amount"] / 100,
            "status": "completed",
            "created_at": datetime.utcnow()
        })
        
        return {"message": "Subscription activated", "status": "active", "plan": plan}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhooks/stripe")
async def stripe_webhook(request):
    """Handle Stripe webhooks"""
    from fastapi import Request
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # For testing without webhook secret
            import json
            event = json.loads(payload)
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    event_type = event.get("type", "")
    
    if event_type == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        logger.info(f"Payment succeeded: {payment_intent['id']}")
        
    elif event_type == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        logger.error(f"Payment failed: {payment_intent['id']}")
        
    elif event_type == "customer.subscription.updated":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        
        # Update subscription status in database
        user = await db.users.find_one({"stripe_customer_id": customer_id})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"subscription_status": subscription.get("status")}}
            )
    
    return {"status": "success"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Ask Yazo API", "version": "1.0", "domain": "askyazo.com"}

# ==================== RESOURCES ENDPOINTS ====================

@api_router.get("/resources")
async def get_resources(category: Optional[str] = None, active_only: bool = True):
    """جلب جميع الموارد - متاح للجميع"""
    query = {}
    if category and category != "all":
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    resources = await db.resources.find(query).sort("created_at", -1).to_list(100)
    
    # تنسيق البيانات للعرض
    result = []
    for r in resources:
        result.append({
            "id": r["_id"],
            "title": r.get("title", ""),
            "description": r.get("description", ""),
            "category": r.get("category", ""),
            "content_type": r.get("content_type", "article"),
            "content": r.get("content", ""),
            "external_url": r.get("external_url", ""),
            "internal_route": r.get("internal_route", ""),
            "duration": r.get("duration", ""),
            "icon": r.get("icon", "document-text"),
            "is_active": r.get("is_active", True),
            "created_at": r.get("created_at"),
        })
    
    return result

@api_router.get("/resources/{resource_id}")
async def get_resource(resource_id: str):
    """جلب مورد واحد بالتفاصيل الكاملة"""
    resource = await db.resources.find_one({"_id": resource_id})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {
        "id": resource["_id"],
        "title": resource.get("title", ""),
        "description": resource.get("description", ""),
        "category": resource.get("category", ""),
        "content_type": resource.get("content_type", "article"),
        "content": resource.get("content", ""),
        "external_url": resource.get("external_url", ""),
        "internal_route": resource.get("internal_route", ""),
        "duration": resource.get("duration", ""),
        "icon": resource.get("icon", "document-text"),
        "is_active": resource.get("is_active", True),
        "created_at": resource.get("created_at"),
        "updated_at": resource.get("updated_at"),
    }

@api_router.post("/admin/resources")
async def create_resource(resource: ResourceCreate, admin: dict = Depends(get_admin_user)):
    """إنشاء مورد جديد - للأدمن فقط"""
    resource_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    resource_dict = {
        "_id": resource_id,
        "title": resource.title,
        "description": resource.description,
        "category": resource.category,
        "content_type": resource.content_type,
        "content": resource.content,
        "external_url": resource.external_url,
        "internal_route": resource.internal_route,
        "duration": resource.duration,
        "icon": resource.icon,
        "is_active": resource.is_active,
        "created_by": admin["_id"],
        "created_at": now,
        "updated_at": now,
    }
    
    await db.resources.insert_one(resource_dict)
    
    return {"message": "تم إنشاء المورد بنجاح", "id": resource_id}

@api_router.put("/admin/resources/{resource_id}")
async def update_resource(resource_id: str, resource: ResourceUpdate, admin: dict = Depends(get_admin_user)):
    """تحديث مورد - للأدمن فقط"""
    existing = await db.resources.find_one({"_id": resource_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    update_data = {k: v for k, v in resource.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.resources.update_one(
        {"_id": resource_id},
        {"$set": update_data}
    )
    
    return {"message": "تم تحديث المورد بنجاح"}

@api_router.delete("/admin/resources/{resource_id}")
async def delete_resource(resource_id: str, admin: dict = Depends(get_admin_user)):
    """حذف مورد - للأدمن فقط"""
    result = await db.resources.delete_one({"_id": resource_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"message": "تم حذف المورد بنجاح"}

@api_router.get("/admin/resources")
async def get_all_resources_admin(admin: dict = Depends(get_admin_user)):
    """جلب جميع الموارد للأدمن (بما فيها غير النشطة)"""
    resources = await db.resources.find({}).sort("created_at", -1).to_list(100)
    
    result = []
    for r in resources:
        result.append({
            "id": r["_id"],
            "title": r.get("title", ""),
            "description": r.get("description", ""),
            "category": r.get("category", ""),
            "content_type": r.get("content_type", "article"),
            "content": r.get("content", ""),
            "external_url": r.get("external_url", ""),
            "internal_route": r.get("internal_route", ""),
            "duration": r.get("duration", ""),
            "icon": r.get("icon", "document-text"),
            "is_active": r.get("is_active", True),
            "created_at": r.get("created_at"),
            "updated_at": r.get("updated_at"),
        })
    
    return result

# ==================== CUSTOM CALCULATORS ENDPOINTS ====================

@api_router.get("/custom-calculators")
async def get_custom_calculators(category: Optional[str] = None, active_only: bool = True):
    """جلب الحاسبات المخصصة - متاح للجميع"""
    query = {}
    if category and category != "all":
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    calculators = await db.custom_calculators.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for calc in calculators:
        result.append({
            "id": calc["_id"],
            "title": calc.get("title", ""),
            "description": calc.get("description", ""),
            "category": calc.get("category", ""),
            "icon": calc.get("icon", "calculator"),
            "is_active": calc.get("is_active", True),
            "created_at": calc.get("created_at"),
        })
    
    return result

@api_router.get("/custom-calculators/{calculator_id}")
async def get_custom_calculator(calculator_id: str):
    """جلب حاسبة واحدة بالكود الكامل"""
    calculator = await db.custom_calculators.find_one({"_id": calculator_id})
    if not calculator:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    return {
        "id": calculator["_id"],
        "title": calculator.get("title", ""),
        "description": calculator.get("description", ""),
        "category": calculator.get("category", ""),
        "icon": calculator.get("icon", "calculator"),
        "html_content": calculator.get("html_content", ""),
        "is_active": calculator.get("is_active", True),
        "created_at": calculator.get("created_at"),
    }

@api_router.post("/admin/custom-calculators")
async def create_custom_calculator(calculator: CustomCalculatorCreate, admin: dict = Depends(get_admin_user)):
    """إنشاء حاسبة مخصصة - للأدمن فقط"""
    calculator_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    calc_dict = {
        "_id": calculator_id,
        "title": calculator.title,
        "description": calculator.description,
        "category": calculator.category,
        "icon": calculator.icon,
        "html_content": calculator.html_content,
        "is_active": calculator.is_active,
        "created_by": admin["_id"],
        "created_at": now,
        "updated_at": now,
    }
    
    await db.custom_calculators.insert_one(calc_dict)
    
    return {"message": "تم إنشاء الحاسبة بنجاح", "id": calculator_id}

@api_router.put("/admin/custom-calculators/{calculator_id}")
async def update_custom_calculator(calculator_id: str, calculator: CustomCalculatorUpdate, admin: dict = Depends(get_admin_user)):
    """تحديث حاسبة - للأدمن فقط"""
    existing = await db.custom_calculators.find_one({"_id": calculator_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    update_data = {k: v for k, v in calculator.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.custom_calculators.update_one(
        {"_id": calculator_id},
        {"$set": update_data}
    )
    
    return {"message": "تم تحديث الحاسبة بنجاح"}

@api_router.delete("/admin/custom-calculators/{calculator_id}")
async def delete_custom_calculator(calculator_id: str, admin: dict = Depends(get_admin_user)):
    """حذف حاسبة - للأدمن فقط"""
    result = await db.custom_calculators.delete_one({"_id": calculator_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    return {"message": "تم حذف الحاسبة بنجاح"}

@api_router.get("/admin/custom-calculators")
async def get_all_custom_calculators_admin(admin: dict = Depends(get_admin_user)):
    """جلب جميع الحاسبات للأدمن"""
    calculators = await db.custom_calculators.find({}).sort("created_at", -1).to_list(100)
    
    result = []
    for calc in calculators:
        result.append({
            "id": calc["_id"],
            "title": calc.get("title", ""),
            "description": calc.get("description", ""),
            "category": calc.get("category", ""),
            "icon": calc.get("icon", "calculator"),
            "html_content": calc.get("html_content", ""),
            "is_active": calc.get("is_active", True),
            "created_at": calc.get("created_at"),
            "updated_at": calc.get("updated_at"),
        })
    
    return result

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
