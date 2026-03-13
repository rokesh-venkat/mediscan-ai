# 💊 AI Medicine Interaction Checker

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

**An AI-powered web application that detects dangerous drug–drug interactions, identifies medicines from photos and videos, and explains risks in plain language — built for the Healthcare AI Hackathon.**

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📌 Overview

Polypharmacy — the simultaneous use of multiple medications — affects millions of elderly patients worldwide. Many dangerous drug interactions go undetected until it is too late.

**AI Medicine Interaction Checker** solves this by combining:

- A curated drug–drug interaction database
- An LLM-powered explanation engine that speaks in plain language
- A computer vision pipeline (YOLOv8 + OpenCV) that identifies tablets from photos or videos
- An OCR prescription scanner that reads medicine names automatically

This is a production-ready MVP designed with clean architecture, JWT authentication, and full Docker support.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure JWT login, signup, and session management |
| 💊 **Manual Medicine Input** | Enter multiple medicine names and check interactions instantly |
| 📷 **Tablet Photo Detection** | Upload a tablet image — AI identifies the medicine with confidence score |
| 🎥 **Video Tablet Detection** | Upload a short video clip — frames are extracted and analysed |
| 📄 **Prescription Scanner** | Upload a prescription image — OCR extracts medicine names automatically |
| ⚠️ **Interaction Engine** | Checks all drug pairs against an interaction dataset |
| 🤖 **AI Explanations** | LLM generates plain-language risk summaries for patients |
| 🎨 **Severity Colour Coding** | Safe (green) / Mild (yellow) / Moderate (orange) / Severe (red) |
| 📋 **History Dashboard** | Browse all previous interaction checks with date, medicines, and result |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)           │
│     TypeScript · Tailwind CSS · ShadCN UI        │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────┐
│              Backend API (FastAPI)               │
│   Auth · Interaction Engine · AI Explainer       │
│              Rate Limiting · JWT                 │
└────────┬─────────────┬───────────────┬──────────┘
         │             │               │
┌────────▼──────┐ ┌────▼────────┐ ┌───▼──────────┐
│  PostgreSQL   │ │  AWS S3     │ │  Vision      │
│  (User data,  │ │  (Images,   │ │  Module      │
│   history,    │ │   Videos,   │ │  OpenCV +    │
│   drug DB)    │ │   Prescrip) │ │  YOLOv8      │
└───────────────┘ └─────────────┘ └──────┬───────┘
                                          │
                                 ┌────────▼───────┐
                                 │  LLM API       │
                                 │  (OpenAI /     │
                                 │   Claude)      │
                                 └────────────────┘
```

### Data Flow — Tablet Detection

```
User uploads image/video
        │
        ▼
FastAPI /upload-image or /upload-video
        │
        ▼
OpenCV Preprocessing (resize, denoise, normalise)
        │
        ▼
YOLOv8 Object Detection (tablet classification)
        │
        ▼
Medicine Name + Confidence Score
        │
        ▼
Auto-fed into Interaction Checker
```

### Data Flow — Prescription Scan

```
User uploads prescription image
        │
        ▼
Tesseract OCR → Raw text
        │
        ▼
NLP token extraction → Medicine names list
        │
        ▼
POST /check-interactions
```

---

## 🗂 Project Structure

```
medicine-ai-checker/
│
├── frontend/                          # Next.js 14 application
│   ├── pages/
│   │   ├── index.tsx                  # Home page
│   │   ├── checker.tsx                # Medicine checker page
│   │   ├── upload.tsx                 # Tablet upload page
│   │   ├── results.tsx                # Results display page
│   │   ├── history.tsx                # History dashboard
│   │   ├── login.tsx                  # Login page
│   │   └── signup.tsx                 # Signup page
│   ├── components/
│   │   ├── MedicineInput.tsx          # Tag-style medicine input
│   │   ├── InteractionCard.tsx        # Result card with severity badge
│   │   ├── SeverityBadge.tsx          # Colour-coded severity indicator
│   │   ├── UploadZone.tsx             # Drag-and-drop file upload
│   │   ├── HistoryTable.tsx           # Previous checks table
│   │   ├── Navbar.tsx                 # Navigation bar
│   │   └── AuthGuard.tsx             # Protected route wrapper
│   ├── services/
│   │   ├── api.ts                     # Axios instance + interceptors
│   │   ├── auth.ts                    # Auth service (login/signup)
│   │   ├── interactions.ts            # Interaction check service
│   │   └── upload.ts                  # File upload service
│   ├── types/
│   │   └── index.ts                   # Shared TypeScript types
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
│
├── backend/                           # FastAPI application
│   ├── main.py                        # App entrypoint, CORS, middleware
│   ├── routers/
│   │   ├── auth.py                    # /auth/signup, /auth/login
│   │   ├── interactions.py            # /check-interactions
│   │   ├── upload.py                  # /upload-image, /upload-video
│   │   └── history.py                 # /history
│   ├── models/
│   │   ├── user.py                    # SQLAlchemy User model
│   │   ├── history.py                 # SQLAlchemy History model
│   │   └── schemas.py                 # Pydantic request/response schemas
│   ├── vision/
│   │   ├── detector.py                # YOLOv8 inference wrapper
│   │   ├── preprocessor.py            # OpenCV preprocessing
│   │   ├── video_processor.py         # Frame extraction + aggregation
│   │   └── ocr.py                     # Tesseract OCR for prescriptions
│   ├── ai_engine/
│   │   └── explainer.py               # LLM prompt builder + API calls
│   ├── interaction_engine/
│   │   ├── checker.py                 # Pairwise interaction lookup
│   │   └── drug_interactions.csv      # Drug interaction dataset
│   ├── core/
│   │   ├── security.py                # JWT creation + verification
│   │   ├── config.py                  # Environment variable settings
│   │   └── dependencies.py            # FastAPI dependency injection
│   ├── database/
│   │   ├── db.py                      # SQLAlchemy engine + session
│   │   └── init_db.py                 # Schema creation script
│   └── requirements.txt
│
├── database/
│   └── schema.sql                     # Raw PostgreSQL schema
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🗃 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)        NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT              NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Interaction history table
CREATE TABLE interaction_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    medicines   TEXT[]              NOT NULL,   -- e.g. {"aspirin","ibuprofen"}
    interaction BOOLEAN             NOT NULL,
    severity    VARCHAR(20),                    -- Safe | Mild | Moderate | Severe
    risk        TEXT,
    recommendation TEXT,
    ai_explanation TEXT,
    checked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Drug interaction dataset table
CREATE TABLE drug_interactions (
    id             SERIAL PRIMARY KEY,
    drug_a         VARCHAR(100) NOT NULL,
    drug_b         VARCHAR(100) NOT NULL,
    severity       VARCHAR(20)  NOT NULL,
    risk           TEXT         NOT NULL,
    recommendation TEXT         NOT NULL
);

CREATE INDEX idx_drug_interactions_pair ON drug_interactions (drug_a, drug_b);
CREATE INDEX idx_history_user ON interaction_history (user_id);
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker** ≥ 24 and **Docker Compose** ≥ 2.20
- **Node.js** ≥ 18 (for local frontend dev without Docker)
- **Python** ≥ 3.11 (for local backend dev without Docker)
- An **OpenAI API key** (or compatible LLM provider key)
- An **AWS S3 bucket** (or MinIO for local dev)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medicine-ai-checker.git
cd medicine-ai-checker
```

---

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the values:

```env
# ── Database ─────────────────────────────────────
POSTGRES_USER=medai
POSTGRES_PASSWORD=changeme
POSTGRES_DB=medicine_checker
DATABASE_URL=postgresql://medai:changeme@db:5432/medicine_checker

# ── JWT ──────────────────────────────────────────
SECRET_KEY=your-super-secret-jwt-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── LLM ──────────────────────────────────────────
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o

# ── AWS S3 ───────────────────────────────────────
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=medicine-checker-uploads
AWS_REGION=ap-south-1

# ── Frontend ─────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PgAdmin (optional) | http://localhost:5050 |

---

### 4. Local Development (Without Docker)

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialise the database
python database/init_db.py

# Start the server
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

---

### 5. Seed the Drug Interaction Dataset

```bash
cd backend
python interaction_engine/seed_data.py
```

This loads `drug_interactions.csv` into PostgreSQL.

---

## 📡 API Reference

All endpoints require `Authorization: Bearer <token>` except `/auth/signup` and `/auth/login`.

---

### Auth

#### `POST /auth/signup`

Register a new user.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongP@ss123"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "created_at": "2025-03-13T10:00:00Z"
}
```

---

#### `POST /auth/login`

Authenticate and receive a JWT.

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "StrongP@ss123"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

### Interactions

#### `POST /check-interactions`

Check drug–drug interactions for a list of medicines.

**Request body:**
```json
{
  "medicines": ["aspirin", "ibuprofen", "metformin"]
}
```

**Response `200`:**
```json
{
  "results": [
    {
      "drug_a": "aspirin",
      "drug_b": "ibuprofen",
      "interaction": true,
      "severity": "Moderate",
      "risk": "Increased bleeding risk",
      "recommendation": "Avoid taking both without medical supervision",
      "ai_explanation": "Taking aspirin and ibuprofen together may increase the risk of stomach bleeding because both medications affect blood clotting and irritate the stomach lining."
    }
  ],
  "overall_severity": "Moderate",
  "safe_pairs": ["aspirin + metformin", "ibuprofen + metformin"]
}
```

---

### Computer Vision

#### `POST /upload-image`

Upload a tablet photo for medicine identification.

**Request:** `multipart/form-data` with field `file` (JPEG / PNG / WEBP, max 10 MB)

**Response `200`:**
```json
{
  "detected_medicine": "Paracetamol",
  "confidence": 0.94,
  "s3_url": "https://your-bucket.s3.amazonaws.com/uploads/abc123.jpg"
}
```

---

#### `POST /upload-video`

Upload a short video clip for medicine identification.

**Request:** `multipart/form-data` with field `file` (MP4 / MOV / AVI, max 50 MB)

**Response `200`:**
```json
{
  "detected_medicine": "Metformin",
  "confidence": 0.88,
  "frames_analysed": 12,
  "s3_url": "https://your-bucket.s3.amazonaws.com/uploads/vid456.mp4"
}
```

---

#### `POST /upload-prescription`

Upload a prescription image for OCR extraction.

**Request:** `multipart/form-data` with field `file` (JPEG / PNG / PDF, max 10 MB)

**Response `200`:**
```json
{
  "extracted_medicines": ["Aspirin", "Metformin", "Lisinopril"],
  "raw_ocr_text": "Aspirin 75mg ... Metformin 500mg ...",
  "s3_url": "https://your-bucket.s3.amazonaws.com/prescriptions/rx789.jpg"
}
```

---

### History

#### `GET /history`

Retrieve the authenticated user's past interaction checks.

**Query params:** `page` (default 1), `limit` (default 20)

**Response `200`:**
```json
{
  "total": 42,
  "page": 1,
  "results": [
    {
      "id": "uuid",
      "medicines": ["aspirin", "ibuprofen"],
      "overall_severity": "Moderate",
      "checked_at": "2025-03-13T09:30:00Z"
    }
  ]
}
```

---

## 🐳 Deployment

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.yml up -d --build
```

The compose file spins up:

- `frontend` — Next.js served via Node
- `backend` — FastAPI via Uvicorn + Gunicorn
- `db` — PostgreSQL 15
- `nginx` — Reverse proxy (port 80 / 443)

---

### Environment-Specific Configs

| File | Purpose |
|---|---|
| `docker-compose.yml` | Production multi-service setup |
| `.env.example` | Template for all environment variables |
| `docker/nginx.conf` | Nginx reverse proxy config |
| `docker/Dockerfile.backend` | Python backend image |
| `docker/Dockerfile.frontend` | Next.js frontend image |

---

### Cloud Deployment (AWS)

1. Push images to **Amazon ECR**
2. Deploy backend on **ECS Fargate** or **EC2**
3. Deploy frontend on **Vercel** or **Amplify**
4. Use **RDS PostgreSQL** for the database
5. Configure **S3** bucket for file uploads
6. Set **CloudFront** CDN in front of S3

---

## 🔒 Security

| Measure | Implementation |
|---|---|
| Password hashing | `bcrypt` via `passlib` |
| Authentication | JWT (HS256), 60-min expiry |
| Rate limiting | `slowapi` — 20 req/min per IP |
| Input validation | Pydantic v2 strict models |
| File validation | MIME type check + 10 MB / 50 MB size limits |
| SQL injection | SQLAlchemy ORM (parameterised queries) |
| CORS | Explicit allowed origins in FastAPI |
| Secrets | Environment variables only — never committed |

---

## 🧪 Running Tests

**Backend tests:**

```bash
cd backend
pytest tests/ -v --cov=. --cov-report=term-missing
```

**Frontend tests:**

```bash
cd frontend
npm run test
```

---

## 🗺 Roadmap

- [ ] Barcode / QR code scanning for medicine identification
- [ ] Push notifications for critical interaction alerts
- [ ] Multilingual support (Tamil, Hindi, Spanish)
- [ ] Integration with national drug databases (FDA, EMA)
- [ ] Doctor sharing — export PDF reports
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Medical Disclaimer

> This application is intended as an **informational tool only** and does not constitute medical advice. Always consult a qualified healthcare professional before making any decisions about your medications. The developers are not liable for any health outcomes resulting from the use of this tool.

---

## 👥 Team

Built with ❤️ for the **Healthcare AI Hackathon**.

---

<div align="center">

**If this project helped you, please give it a ⭐ on GitHub!**

</div>
