# SkillX — AI Coding Tutor for Enterprises

> **Upskill teams, track progress, and ace technical interviews with AI-powered adaptive learning.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![React](https://img.shields.io/badge/react-18+-61DAFB)
![Django](https://img.shields.io/badge/django-4.2+-092E20)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 📌 Problem Statement

Enterprises struggle to upskill engineering teams efficiently. Developers lack personalized coding practice, real-time feedback, and interview preparation tailored to their tech stack. SkillX solves this with an AI-powered platform that adapts to each user, tracks real progress, and generates resume-based interview questions automatically.

---

## ✨ Features

| Feature | Status | Description |
|---|---|---|
| 🔐 JWT Authentication | ✅ Complete | Secure signup, login, logout with JWT tokens |
| 📊 Dashboard | ✅ Complete | Real-time stats — accuracy, streak, level, problems solved |
| 💻 Code Editor | ✅ Complete | Write and execute real Python code in the browser |
| ✅ Code Execution | ✅ Complete | Server-side execution with real pass/fail test cases |
| 📈 Analytics | ✅ Complete | Charts showing progress, accuracy, topic distribution |
| 📄 Resume Parser | ✅ Complete | Upload PDF → AI extracts skills → generates interview questions |
| 🎯 Adaptive Problems | ✅ Complete | Multiple problems with difficulty tracking |
| 🔄 Session Persistence | ✅ Complete | Stay logged in on page refresh |
| 🎤 Mock Interview | 🚧 Coming Soon | AI-powered live mock interview with scoring |


## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** — fast SPA with component-based architecture
- **Chart.js** — analytics visualizations
- **CSS3** — custom animations, canvas effects, responsive design

### Backend
- **Django 4.2** + **Django REST Framework** — REST API
- **Simple JWT** — token-based authentication
- **PyPDF2** — PDF resume parsing
- **SQLite** — database (upgradeable to PostgreSQL)
- **Python subprocess** — sandboxed code execution

### Architecture
```
SkillX/
├── backend/                  # Django REST API
│   ├── api/
│   │   ├── views.py          # All API endpoints
│   │   └── urls.py           # URL routing
│   ├── skillx_backend/
│   │   ├── settings.py       # Django configuration
│   │   └── urls.py           # Main URL config
│   ├── manage.py
│   └── requirements.txt
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── App.jsx           # Main app with all components
    │   ├── styles.css        # Global styles
    │   └── main.jsx          # Entry point
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip
- npm

### 1. Clone the Repository
```bash
git clone https://github.com/Harshitabansal123/SkillX.git
cd SkillX
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers PyPDF2

# Run database migrations
python manage.py migrate

# Start the backend server
python manage.py runserver
```
Backend runs at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 4. Open the App
Visit `http://localhost:5173` in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/home/` | No | Health check |
| POST | `/api/signup/` | No | Register new user |
| POST | `/api/login/` | No | Login, returns JWT token |
| GET | `/api/dashboard/` | ✅ Yes | Get user stats |
| POST | `/api/code/run/` | ✅ Yes | Execute code, get test results |
| POST | `/api/code/submit/` | ✅ Yes | Submit solution, get score |
| POST | `/api/resume/upload/` | ✅ Yes | Upload PDF, get skills + questions |
| POST | `/api/token/refresh/` | No | Refresh JWT token |

