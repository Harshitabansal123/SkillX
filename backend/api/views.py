from .validators import sanitize_username, sanitize_code_input, sanitize_email, validate_password_strength
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Progress, SolvedProblem
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

import subprocess
import tempfile
import os
import sys
import requests
import csv
from io import StringIO


# ================= JWT =================
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ================= HOME =================
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
    return Response({"message": "SkillX Backend Running 🚀"})


# ================= AUTH =================
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    username = sanitize_username(request.data.get("username", "").strip())
    email = sanitize_email(request.data.get("email", "").strip())
    password = request.data.get("password", "")

    if not username or not email or not password:
        return Response({"error": "All fields required"}, status=400)

    validate_password_strength(password)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username taken"}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    tokens = get_tokens(user)

    return Response({
        "message": "Account created",
        "token": tokens["access"],
        "username": user.username
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = sanitize_username(request.data.get("username", "").strip())
    password = request.data.get("password", "")

    user = authenticate(username=username, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    tokens = get_tokens(user)

    return Response({
        "token": tokens["access"],
        "username": user.username
    })


# ================= DASHBOARD =================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user = request.user
    progress, _ = Progress.objects.get_or_create(user=user)

    accuracy = int(progress.score / progress.submissions) if progress.submissions > 0 else 0

    return Response({
        "username": user.username,
        "accuracy": accuracy,
        "problems_solved": progress.problems_solved,
        "level": progress.problems_solved // 2 + 1
    })


# ================= COMPANIES (FINAL VERSION) =================

COMPANIES = [
    "Amazon","Google","Microsoft","Meta","Apple",
    "Netflix","Adobe","Uber","Atlassian","Goldman Sachs",
    "Morgan Stanley","Walmart","Flipkart","Paytm","Razorpay",
    "Zomato","Swiggy","Ola","Salesforce","Oracle",
    "IBM","SAP","TCS","Infosys","Wipro"
]


@api_view(['GET'])
@permission_classes([AllowAny])
def get_companies(request):
    return Response({
        "companies": [
            {"id": c.lower().replace(" ", ""), "name": c}
            for c in COMPANIES
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_company_questions(request, company_name):
    try:
        # Fix naming issues
        company_map = {
            "goldmansachs": "Goldman Sachs",
            "morganstanley": "Morgan Stanley"
        }

        company_display = company_map.get(company_name, company_name.capitalize())

        url = f"https://raw.githubusercontent.com/liquidslr/interview-company-wise-problems/main/{company_display}/5.%20All.csv"

        res = requests.get(url)
        res.raise_for_status()

        csv_data = StringIO(res.text)
        reader = csv.DictReader(csv_data)

        questions = []

        for i, row in enumerate(reader):
            title = row.get("Title", "")
            raw_link = row.get("Leetcode Link")

            # 🔥 FIX 1: If no link → generate from title
            if not raw_link:
                slug = title.lower().replace(" ", "-")
                raw_link = f"https://leetcode.com/problems/{slug}/"

            # 🔥 FIX 2: If relative link
            if raw_link.startswith("/"):
                raw_link = "https://leetcode.com" + raw_link

            # 🔥 FIX 3: If still invalid
            if not raw_link.startswith("http"):
                slug = title.lower().replace(" ", "-")
                raw_link = f"https://leetcode.com/problems/{slug}/"

            questions.append({
                "id": i + 1,
                "title": title,
                "difficulty": row.get("Difficulty"),
                "topic": row.get("Tags"),
                "link": raw_link
            })

        return Response({
            "company": {
                "full_name": company_display,
                "rounds": ["Online Assessment", "Interviews"]
            },
            "questions": questions[:25]   # limit
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ================= RUN CODE =================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code(request):
    code = sanitize_code_input(request.data.get("code", "").strip())

    if not code:
        return Response({"error": "No code"}, status=400)

    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            path = f.name

        result = subprocess.run(
            [sys.executable, path],
            capture_output=True,
            text=True,
            timeout=5
        )

        os.unlink(path)

        return Response({
            "output": result.stdout,
            "error": result.stderr
        })

    except Exception as e:
        return Response({"error": str(e)})


# ================= SUBMIT CODE =================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):
    user = request.user
    progress, _ = Progress.objects.get_or_create(user=user)

    progress.submissions += 1
    progress.score += 100
    progress.problems_solved += 1
    progress.save()

    return Response({
        "status": "Accepted",
        "score": 100
    })


# ================= LOGOUT =================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get("refresh"))
        token.blacklist()
        return Response({"message": "Logged out"})
    except:
        return Response({"error": "Invalid token"}, status=400)