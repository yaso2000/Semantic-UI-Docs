# Holistic Life Coaching Mobile App - Documentation

## 📱 App Overview

A comprehensive bilingual (English/Arabic) mobile application for holistic life coaching that focuses on four interconnected pillars: Physical Fitness, Nutritional Health, Mental Wellness, and Spiritual Well-being.

## 🎯 Features Implemented

### Phase 1: Core Foundation ✅

#### Authentication System
- **Email/Password Registration** - Users can create accounts as clients
- **Login System** - Secure JWT-based authentication
- **Session Management** - Token storage using AsyncStorage
- **Admin Account** - Created super-user account for coach

#### Navigation Structure
- **Welcome Screen** - Beautiful landing page with four pillars visualization
- **Tab Navigation** - 5 main tabs: Home, Calculators, Bookings, Chat, Profile
- **Stack Navigation** - Seamless screen transitions

#### User Interface
- **Mobile-First Design** - Optimized for phones and tablets
- **Touch-Friendly** - 48px minimum touch targets
- **Professional Aesthetic** - Clean, inspiring design
- **Icon System** - Ionicons throughout for consistency

### Backend API (FastAPI) ✅

#### Endpoints Implemented:

**Authentication:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user profile

**Calculators:**
- `POST /api/calculators/save` - Save calculator history
- `GET /api/calculators/history/{type}` - Get user's calculator history

**Hourly Packages:**
- `POST /api/packages` - Create package (Admin only)
- `GET /api/packages` - List active packages
- `PUT /api/packages/{id}` - Update package (Admin)
- `DELETE /api/packages/{id}` - Delete package (Admin)

**Bookings & Payments:**
- `POST /api/bookings/create` - Create booking with Stripe payment
- `POST /api/bookings/{id}/confirm` - Confirm payment
- `GET /api/bookings/my-bookings` - User's booking history
- `GET /api/bookings/all` - All bookings (Admin)

**Messaging:**
- `POST /api/messages/send` - Send message
- `GET /api/messages/{recipient_id}` - Get conversation
- `GET /api/messages/conversations` - List all conversations
- Socket.IO integration for real-time messaging

**Intake Questionnaire:**
- `POST /api/intake/submit` - Submit assessment
- `GET /api/intake/my-intake` - Get user's intake
- `GET /api/intake/all` - All intakes (Admin)

**Resource Library:**
- `POST /api/resources/upload` - Upload resource (Admin)
- `GET /api/resources` - List resources (filterable by category)
- `DELETE /api/resources/{id}` - Delete resource (Admin)

**Habit Tracker:**
- `POST /api/habits/save` - Save daily habits
- `GET /api/habits/my-habits` - Get habits in date range

**Admin Dashboard:**
- `GET /api/admin/users` - List all client users
- `GET /api/admin/stats` - Get platform statistics

## 🔐 Test Credentials

**Admin Account:**
- Email: coach@holistic.com
- Password: coach123
- Role: admin

## 🛠️ Technical Stack

### Frontend
- **Framework:** Expo (React Native)
- **Navigation:** Expo Router with file-based routing
- **UI Library:** React Native Paper
- **State Management:** AsyncStorage for local state
- **HTTP Client:** Axios
- **Real-time:** Socket.io-client
- **Payments:** @stripe/stripe-react-native

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB with Motor (async driver)
- **Authentication:** JWT with python-jose
- **Password Hashing:** Passlib with bcrypt
- **Payments:** Stripe Python SDK
- **Real-time:** Python-SocketIO

## 📂 Project Structure

```
/app/
├── backend/
│   ├── server.py          # Main API server with all endpoints
│   ├── .env              # Environment variables & secrets
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── app/
    │   ├── index.tsx                # Welcome/Landing screen
    │   ├── _layout.tsx              # Root layout with providers
    │   ├── (auth)/
    │   │   ├── login.tsx            # Login screen
    │   │   └── register.tsx         # Registration screen
    │   ├── (tabs)/
    │   │   ├── _layout.tsx          # Tab navigation setup
    │   │   ├── home.tsx             # Home dashboard
    │   │   ├── calculators.tsx      # Health calculators (Placeholder)
    │   │   ├── bookings.tsx         # Session bookings (Placeholder)
    │   │   ├── chat.tsx             # Real-time chat (Placeholder)
    │   │   └── profile.tsx          # User profile & settings
    │   ├── contexts/
    │   │   └── AuthContext.tsx      # Authentication context
    │   ├── services/
    │   │   └── api.ts               # Axios API client
    │   └── utils/
    │       └── translations.ts      # Bilingual text (EN/AR placeholders)
    ├── .env                         # Frontend environment variables
    └── package.json                 # Dependencies

```

## 🚀 How to Use the App

### 1. Registration/Login Flow
1. Open the app - You'll see the welcome screen with four pillars
2. Tap "Register" to create a new account or "Login" if you have one
3. Fill in your details and submit
4. You'll be redirected to the Home dashboard

### 2. Home Dashboard
- See personalized greeting
- View the four pillars of wellness
- Quick action buttons to navigate to main features

### 3. Profile Screen
- View your account information
- Access intake assessment (coming soon)
- Browse resource library (coming soon)
- Track habits (coming soon)
- Logout option

## 🎨 Design Philosophy

### Four Pillars Color System
- **Physical (Green #4CAF50)** - Fitness, exercise, body health
- **Nutritional (Orange #FF9800)** - Diet, nutrition, healthy eating
- **Mental (Purple #9C27B0)** - Mental wellness, mindfulness
- **Spiritual (Cyan #00BCD4)** - Inner peace, meditation

### Mobile UX Principles
- **Thumb-friendly navigation** - All primary actions within reach
- **Clear visual hierarchy** - Important information stands out
- **Generous whitespace** - Easy to scan and read
- **Consistent iconography** - Ionicons throughout

## 🔄 Next Development Phases

### Phase 2: Calculators Implementation
- BMI Calculator with visual results
- TDEE/Calorie Calculator with activity levels
- Anxiety Assessment questionnaire with scoring

### Phase 3: Booking & Payments
- Package selection UI
- Stripe payment integration in mobile
- PayPal alternative payment
- Booking history with status

### Phase 4: Real-Time Chat
- Socket.IO connection setup
- Message bubbles UI
- File attachment support (base64)
- Online/offline indicators

### Phase 5: Extended Features
- Multi-step intake questionnaire
- Resource library with categories
- Habit tracker with calendar view
- Progress visualization

### Phase 6: Admin Features
- Full admin dashboard
- User management interface
- Analytics and reports
- Package management UI

## 🌐 API Base URL

Development: https://holistic-coach-app.preview.emergentagent.com/api

## 💳 Payment Integration

**Stripe Configuration:**
- Test Mode Keys Configured
- Publishable Key: pk_test_51SkZ9D3vi5i0zYbODCp4qG2RlQw2aHHc9yMyXkepvnWl4QT7In8AEDT1JcpmxycpHerPhsrVSdkn5MP5x5MviFUC00ZU6GFui2
- Secret Key: Stored in backend .env

**Test Cards:**
- Success: 4242 4242 4242 4242
- Requires Authentication: 4000 0025 0000 3155
- Declined: 4000 0000 0000 9995

## 🗄️ Database Collections

1. **users** - User accounts (clients & admin)
2. **calculator_history** - Saved calculator results
3. **hourly_packages** - Coaching session packages
4. **bookings** - Session bookings with payment info
5. **messages** - Chat messages
6. **intake_responses** - Questionnaire responses
7. **resources** - Uploaded files/documents
8. **habits** - Daily habit tracking

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="holistic_coaching_db"
JWT_SECRET="your-secret-key-change-in-production-12345"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Frontend (.env)
```
EXPO_PUBLIC_BACKEND_URL=https://holistic-coach-app.preview.emergentagent.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📱 Supported Platforms
- iOS
- Android  
- Web (via Expo)

## 🎯 Key Features Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Authentication | ✅ | ✅ | Complete |
| Navigation | N/A | ✅ | Complete |
| Home Dashboard | N/A | ✅ | Complete |
| Profile | ✅ | ✅ | Complete |
| BMI Calculator | ✅ | ⏳ | Backend Ready |
| TDEE Calculator | ✅ | ⏳ | Backend Ready |
| Anxiety Assessment | ✅ | ⏳ | Backend Ready |
| Hourly Packages | ✅ | ⏳ | Backend Ready |
| Bookings | ✅ | ⏳ | Backend Ready |
| Stripe Payments | ✅ | ⏳ | Backend Ready |
| Real-time Chat | ✅ | ⏳ | Backend Ready |
| Intake Form | ✅ | ⏳ | Backend Ready |
| Resource Library | ✅ | ⏳ | Backend Ready |
| Habit Tracker | ✅ | ⏳ | Backend Ready |
| Admin Dashboard | ✅ | ⏳ | Backend Ready |

✅ = Complete | ⏳ = In Progress | ❌ = Not Started

## 🐛 Known Issues
- None currently - Foundation is stable!

## 📝 Notes
- All images should be stored as base64 in MongoDB
- Bilingual text currently uses placeholder translations
- Socket.IO server is running but frontend integration pending
- PayPal integration planned but not yet implemented
