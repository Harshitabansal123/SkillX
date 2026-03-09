# SkillX – AI Powered Coding Tutor Platform

SkillX is a full-stack AI-powered learning platform designed to help users improve coding skills, track learning progress, and receive intelligent assistance while practicing programming. The platform combines a modern React frontend with a Django REST backend to create a scalable and interactive learning environment.

---

## 🚀 Features

• AI-powered coding tutor assistance
• Skill and progress tracking dashboard
• Interactive coding practice environment
• REST API based backend architecture
• Responsive and modern user interface
• Modular backend structure for easy scalability

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* CSS

### Backend

* Django
* Django REST Framework

### Database

* SQLite

### Version Control

* Git
* GitHub

---

## 📂 Project Structure

```
SkillX
│
├── Frontend/              # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/               # Django backend
│   ├── api/               # API endpoints
│   ├── skillx_backend/    # Django project configuration
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/Harshitabansal123/SkillX.git
cd SkillX
```

---

### 2️⃣ Backend Setup (Django)

Navigate to the backend folder:

```
cd backend
```

Create a virtual environment:

```
python -m venv venv
```

Activate the virtual environment

Windows:

```
venv\Scripts\activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Run database migrations:

```
python manage.py migrate
```

Start the backend server:

```
python manage.py runserver
```

---

### 3️⃣ Frontend Setup (React)

Navigate to the frontend folder:

```
cd Frontend
```

Install dependencies:

```
npm install
```

Run the frontend development server:

```
npm run dev
```

---

## 🌐 Application Workflow

1. Users interact with the **React frontend interface**
2. Requests are sent to the **Django REST API**
3. Backend processes requests and interacts with the **database**
4. Responses are returned to the frontend and displayed to the user

---

## 📄 License

This project is developed for educational and learning purposes.
