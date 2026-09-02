

# 🌾 AgroConnect-360

> **An end-to-end agricultural intelligence platform** connecting farmers, sellers, exporters, and buyers with real-time market prices, AI-powered crop disease diagnosis, weather advisory, ML-driven price predictions, marketplace management, and secure online payments.

---

## 📌 Project Overview

**AgroConnect-360** bridges the gap between Indian agriculture and modern technology by providing an intelligent digital platform for multiple agricultural stakeholders.

### 🌟 Key Features

* 📊 **Live APMC Market Prices** — Real-time mandi data
* 🤖 **ML Price Predictions** — Machine learning-based commodity price forecasting
* 🌦️ **Weather Advisory** — Weather insights and agricultural recommendations
* 🌿 **AI Crop Disease Diagnosis** — AI-powered disease detection from crop images
* 🛒 **Agricultural Marketplace** — Buy and sell agricultural products
* 📦 **Order Management** — Complete order lifecycle management
* 💳 **Secure Online Payments** — Razorpay integration for online payments
* 💵 **Cash on Delivery** — Existing COD payment flow
* 🔄 **Payment Retry System** — Retry failed or pending Razorpay payments
* 🔔 **Payment Notifications** — Notifications after successful payments
* 📈 **Market Trends** — Historical market analysis and charts
* 👥 **Multi-Role Dashboards** — Farmer, Seller, Exporter, Admin, and User
* ☁️ **Cloud Image Storage** — Cloudinary integration
* 🔐 **JWT Authentication & OTP Verification**

---

# 🆕 Latest Update — Payment Management V2

AgroConnect-360 now includes a secure **Razorpay payment management system**.

## 💳 Razorpay Integration

Supported online payment methods include:

* 📱 UPI
* 💳 Debit Cards
* 💳 Credit Cards
* 🏦 Net Banking
* 👛 Wallets supported by Razorpay

### Payment Flow

```text
User selects Online Payment
        ↓
Application creates pending order
        ↓
Backend calculates amount from database
        ↓
Razorpay order is created
        ↓
Razorpay Checkout opens
        ↓
User completes payment
        ↓
Backend verifies Razorpay signature
        ↓
Payment status updated to PAID
        ↓
Payment notification created
        ↓
Order confirmation displayed
```

---

## 🔄 Payment Retry System

Users can retry Razorpay payments when:

* Payment status is `pending`
* Payment status is `failed`
* Payment method is `razorpay`
* Order is not cancelled
* Order is not rejected
* Order is not delivered

### Retry Flow

```text
Pending / Failed Razorpay Order
            ↓
      Retry Payment
            ↓
Fresh Razorpay Order Created
            ↓
Existing Application Order Reused
            ↓
      Razorpay Checkout
            ↓
      Backend Verification
            ↓
        Payment Paid
```

> Stock is not deducted again during payment retry because the existing application order is reused.

---

# 🔐 Payment Security

The Razorpay integration includes multiple security protections:

* ✅ Payment amount is never trusted from the frontend
* ✅ Amount is calculated from the database
* ✅ Razorpay secret key remains on the backend
* ✅ Order ownership is verified
* ✅ MongoDB ObjectIds are validated
* ✅ Razorpay order ID is cross-checked
* ✅ HMAC SHA-256 signature verification
* ✅ Timing-safe signature comparison
* ✅ Already-paid order protection
* ✅ Duplicate verification protection
* ✅ Duplicate stock deduction prevention
* ✅ Cancelled orders cannot be charged
* ✅ Rejected orders cannot be charged
* ✅ Delivered orders cannot be charged
* ✅ Webhook signature verification
* ✅ Idempotent webhook processing
* ✅ No payment secrets exposed to frontend

---

# 🏗️ Architecture

```text
AgroConnect-360/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── ...
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── Notification.js
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── ...
│   │
│   ├── services/
│   │   └── ...
│   │
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── RazorpayCheckout.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── dashboards/
│       │   ├── farmer/
│       │   ├── seller/
│       │   ├── exporter/
│       │   ├── admin/
│       │   └── user/
│       │
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── VerifyOTP.jsx
│       │   └── ...
│       │
│       ├── services/
│       └── App.jsx
│
└── ml/
    ├── train_price_model.py
    ├── train_dynamic_model.py
    ├── predict_price.py
    ├── predict_dynamic.py
    └── models/
```

---

# 🛠️ Tech Stack

| Layer                    | Technology              |
| ------------------------ | ----------------------- |
| **Frontend**             | React 18, Vite          |
| **Routing**              | React Router v6         |
| **Backend**              | Node.js, Express        |
| **Database**             | MongoDB                 |
| **ODM**                  | Mongoose                |
| **Authentication**       | JWT                     |
| **OTP**                  | Nodemailer + Gmail SMTP |
| **Payments**             | Razorpay                |
| **AI Disease Detection** | Google Gemini Vision    |
| **Machine Learning**     | scikit-learn            |
| **Price Prediction**     | RandomForest            |
| **Image Storage**        | Cloudinary              |
| **Market Data**          | Data.gov India APMC API |
| **Weather**              | OpenWeatherMap API      |
| **Charts**               | Recharts                |
| **ML Language**          | Python                  |

---

# 👥 User Roles

| Role              | Features                                          |
| ----------------- | ------------------------------------------------- |
| 🌾 **Farmer**     | Crop listings, disease detection, weather, orders |
| 🏪 **Seller**     | Browse products, procurement, marketplace         |
| 🚢 **Exporter**   | Bulk orders, market intelligence, analytics       |
| 👨‍💼 **Admin**   | User management, orders, payment monitoring       |
| 👤 **User/Buyer** | Browse products, cart, orders, payments           |

---

# 🚀 Local Setup

## Prerequisites

Make sure you have:

* Node.js **18+**
* MongoDB Atlas account
* Python **3.10+**
* npm
* Razorpay Test Account
* Cloudinary account
* Google AI Studio API key

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/AjayKumarKR07/agroconnect-360.git
```

```bash
cd agroconnect-360
```

---

# 🔧 Backend Setup

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Install Razorpay:

```bash
npm install razorpay
```

Create your environment file:

```bash
cp .env.example .env
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Start the frontend:

```bash
npm run dev
```

Frontend typically runs on:

```text
http://localhost:5173
```

---

# 🧠 ML Setup

```bash
cd ml
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Example prediction:

```bash
python predict_dynamic.py --state Karnataka --district Kolar --market Bangarpet --commodity Tomato
```

---

# 🔑 Environment Variables

## Backend `.env`

```env
# Server
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_secure_jwt_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Data.gov India
DATA_GOV_API_KEY=your_data_gov_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# Weather
OPENWEATHER_API_KEY=your_openweather_api_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Razorpay Webhook
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

> ⚠️ **Never commit your `.env` file or real API keys to GitHub.**

---

# 💳 Razorpay Configuration

## Test Mode

Use Razorpay **Test Mode** credentials during development:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
```

The secret key must **never** be sent to the frontend.

---

## Production Mode

After completing Razorpay verification and KYC:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret
```

---

# 🔔 Razorpay Webhook

Webhook endpoint:

```text
POST /api/payment/webhook
```

Production webhook URL:

```text
https://your-domain.com/api/payment/webhook
```

Recommended events:

```text
payment.captured
payment.failed
```

The webhook provides backup payment confirmation for production reliability.

---

# 📡 API Endpoints

## 🔐 Authentication

| Method | Endpoint               | Description                 |
| ------ | ---------------------- | --------------------------- |
| POST   | `/api/auth/send-otp`   | Send OTP                    |
| POST   | `/api/auth/verify-otp` | Verify OTP and authenticate |
| GET    | `/api/auth/me`         | Get authenticated user      |

---

## 👤 Profile

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| GET    | `/api/profile` | Get profile    |
| PUT    | `/api/profile` | Update profile |

---

## 🌾 Crops

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | `/api/crops` | Get crop listings   |
| POST   | `/api/crops` | Create crop listing |

---

## 📦 Orders

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/orders` | Get orders   |
| POST   | `/api/orders` | Create order |

---

# 💳 Payment API

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| POST   | `/api/payment/create-order`   | Create Razorpay order        |
| POST   | `/api/payment/verify`         | Verify Razorpay payment      |
| POST   | `/api/payment/retry/:orderId` | Retry pending/failed payment |
| POST   | `/api/payment/webhook`        | Razorpay webhook             |

---

## 🌿 AI Disease Diagnosis

| Method | Endpoint         | Description                |
| ------ | ---------------- | -------------------------- |
| POST   | `/api/diagnosis` | Analyze crop disease image |

---

## 📊 Market Prices

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/prices/live`       | Live APMC prices    |
| GET    | `/api/prices/historical` | Historical prices   |
| GET    | `/api/prices/predict`    | ML price prediction |

---

## 🌦️ Weather

| Method | Endpoint       | Description         |
| ------ | -------------- | ------------------- |
| GET    | `/api/weather` | Weather information |

---

## ❤️ Health Check

| Method | Endpoint      | Description          |
| ------ | ------------- | -------------------- |
| GET    | `/api/health` | Server health status |

---

# 💰 Payment Status

Orders support payment states such as:

| Status         | Meaning                        |
| -------------- | ------------------------------ |
| 🟡 **Pending** | Payment has not been completed |
| 🟢 **Paid**    | Payment successfully verified  |
| 🔴 **Failed**  | Payment attempt failed         |

---

# 🔄 Payment Methods

| Method     | Description                     |
| ---------- | ------------------------------- |
| `cod`      | Cash on Delivery                |
| `razorpay` | Online payment through Razorpay |

---

# 📦 Order and Stock Handling

```text
Order Creation
      ↓
Stock Deducted
      ↓
Payment Pending (for Razorpay)
      ↓
Payment Verified
      ↓
Payment Status = Paid
```

For payment retries:

```text
Existing Order
      ↓
Fresh Razorpay Payment Attempt
      ↓
No New Application Order
      ↓
No Duplicate Stock Deduction
```

---

# 🛡️ Admin Payment Management

Administrators can monitor:

* Payment method
* Payment status
* Razorpay payment reference ID
* Order status

Supported payment filters include:

```text
Paid
Pending
Failed
COD
```

---

# 🌿 AI Crop Disease Detection

The platform uses AI vision capabilities to analyze uploaded crop or leaf images.

Typical workflow:

```text
Upload Leaf Image
       ↓
Cloud/Image Processing
       ↓
AI Vision Analysis
       ↓
Disease Identification
       ↓
Symptoms & Recommendations
       ↓
Suggested Agricultural Actions
```

> AI-generated diagnosis should be treated as agricultural decision support and not as a guaranteed replacement for expert agronomist advice.

---

# 📊 ML Price Prediction

The ML module uses historical agricultural market data to predict commodity prices.

Models include:

* RandomForest-based prediction
* Commodity-specific models
* Dynamic market prediction models

Example:

```bash
python predict_dynamic.py \
  --state Karnataka \
  --district Kolar \
  --market Bangarpet \
  --commodity Tomato
```

---

# 🧪 Verification

Backend syntax checks:

```bash
node --check controllers/paymentController.js
```

```bash
node --check routes/paymentRoutes.js
```

```bash
node --check models/Order.js
```

```bash
node --check server.js
```

Frontend production build:

```bash
cd frontend
npm run build
```

---

# 🔒 Security Best Practices

AgroConnect-360 follows these security practices:

* 🔐 JWT-based authentication
* 👤 Role-based access control
* 🔑 Environment variables for secrets
* 💳 Backend-only payment verification
* 🛡️ Razorpay HMAC signature validation
* 🚫 No secret API keys in frontend code
* 🔒 Order ownership validation
* 🔁 Idempotent payment verification
* 📦 Duplicate stock deduction prevention
* ☁️ Secure cloud image handling
* 🆔 MongoDB ObjectId validation

---

# 🗺️ Future Improvements

* [ ] Payment expiration for abandoned orders
* [ ] Background jobs for automatic stock restoration
* [ ] Advanced disease detection models
* [ ] More crop disease datasets
* [ ] Multilingual support
* [ ] Mobile application
* [ ] Real-time notifications
* [ ] Advanced analytics dashboard
* [ ] AI agricultural assistant improvements
* [ ] Production payment monitoring
* [ ] Invoice generation
* [ ] Order tracking integration

---

# 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repository
# Create a new branch
git checkout -b feature/your-feature

# Make changes

# Commit
git commit -m "feat: add your feature"

# Push
git push origin feature/your-feature
```

Then create a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Ajay Kumar K R**

🌾 **AgroConnect-360 — Empowering Agriculture Through Technology**

---

### ⭐ If you like this project, consider giving the repository a star!
