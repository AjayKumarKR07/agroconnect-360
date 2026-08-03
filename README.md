# 🌾 AgroConnect-360

> **An end-to-end agricultural intelligence platform** connecting farmers, sellers, and exporters with real-time market prices, AI-powered crop disease diagnosis, weather advisory, and ML-driven price predictions.

---

## 📌 Project Overview

AgroConnect-360 bridges the gap between Indian farmers and the market by providing:

- 📊 **Live APMC Market Prices** — Real-time mandi data via Data.gov API
- 🤖 **ML Price Predictions** — RandomForest models trained on historical APMC data
- 🌦️ **Weather Advisory** — Hyperlocal weather with sowing/irrigation recommendations
- 🌿 **AI Crop Diagnosis** — Google Gemini Vision for disease detection from photos
- 🛒 **Marketplace** — Direct farmer-to-buyer crop listings and order management
- 📈 **Market Trends** — 30-day historical charts with MSP comparison

---

## 🏗️ Architecture

```
AgroConnect-360/
├── backend/          # Node.js + Express 5 REST API
│   ├── config/       # MongoDB, Cloudinary config
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Auth JWT middleware
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express routers
│   ├── services/     # Business logic, external APIs
│   └── server.js     # App entry point
│
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── components/   # Navbar, ProtectedRoute
│       ├── context/      # AuthContext
│       ├── dashboards/   # farmer/ seller/ exporter/ admin/ user/
│       ├── pages/        # Home, Login, VerifyOTP, MarketTrends, etc.
│       ├── services/     # API client functions
│       └── App.jsx       # Router setup
│
└── ml/               # Python ML pipeline
    ├── train_price_model.py      # Basic model trainer
    ├── train_dynamic_model.py    # Dynamic per-commodity trainer
    ├── predict_price.py          # Inference script
    ├── predict_dynamic.py        # Multi-model prediction
    └── models/                   # Saved .joblib model files
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express 5, MongoDB, Mongoose |
| **Auth** | JWT, OTP via Nodemailer (Gmail) |
| **AI/ML** | Google Gemini 2.0 Flash, scikit-learn, RandomForest |
| **Storage** | Cloudinary (images) |
| **Market Data** | Data.gov India APMC API |
| **Weather** | OpenWeatherMap API |
| **Frontend** | React 18, Vite, React Router v6 |
| **Charts** | Recharts |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Python 3.10+

### Backend
```bash
cd backend
npm install
cp .env.example .env     # Fill in your credentials
npm run dev              # Starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # Starts on http://localhost:5173
```

### ML Service
```bash
cd ml
pip install -r requirements.txt
python predict_dynamic.py --state Karnataka --district Kolar --market Bangarpet --commodity Tomato
```

---

## 🔑 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required keys.

**Backend keys required:**
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Random 64-byte hex string
- `GEMINI_API_KEY` — Google AI Studio key
- `DATA_GOV_API_KEY` — data.gov.in API key
- `CLOUDINARY_*` — Cloudinary cloud credentials
- `EMAIL_USER` / `EMAIL_APP_PASSWORD` — Gmail SMTP
- `OPENWEATHER_API_KEY` — OpenWeatherMap key

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/api/auth/me` | Get authenticated user |
| GET/PUT | `/api/profile` | User profile management |
| GET/POST | `/api/crops` | Crop listings |
| GET/POST | `/api/orders` | Order management |
| GET | `/api/weather` | Weather by coordinates |
| POST | `/api/diagnosis` | AI crop disease diagnosis |
| GET | `/api/prices/live` | Live APMC market prices |
| GET | `/api/prices/historical` | 30-day historical prices |
| GET | `/api/prices/predict` | ML price prediction |
| GET | `/api/health` | Server health check |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Farmer** | Create listings, manage orders, weather, diagnosis |
| **Seller** | Browse listings, place orders, view market trends |
| **Exporter** | Bulk orders, export analytics, market intelligence |
| **Admin** | Platform management, user oversight |
| **User** | General market browsing |

---

## 📄 License

MIT © 2026 Ajay Kumar K R
