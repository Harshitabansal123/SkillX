import re
import subprocess
import tempfile
import os
import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Progress


# ───────── JWT Helpers ─────────
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ───────── HOME ─────────
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
    return Response({"message": "SkillX Backend Running ✦"})


# ───────── SIGNUP ─────────
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not username or not email or not password:
        return Response({"error": "All fields required"}, status=400)

    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)

    Progress.objects.get_or_create(user=user)

    tokens = get_tokens(user)

    return Response({
        "message": "Account created",
        "token": tokens["access"],
        "refresh": tokens["refresh"],
        "username": user.username
    })


# ───────── LOGIN ─────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        tokens = get_tokens(user)
        return Response({
            "token": tokens["access"],
            "refresh": tokens["refresh"]
        })

    return Response({"error": "Invalid credentials"}, status=401)


# ───────── LOGOUT ─────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get("refresh"))
        token.blacklist()
        return Response({"message": "Logged out"})
    except:
        return Response({"error": "Invalid token"}, status=400)


# ───────── DASHBOARD ─────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    progress, _ = Progress.objects.get_or_create(user=request.user)

    return Response({
        "username": request.user.username,
        "problems_solved": progress.problems_solved,
        "submissions": progress.submissions
    })


# ───────── SAFE PYTHON EXECUTION ─────────
def run_python_code(code, test_input, test_type):
    try:
        runner = f"""
import json
{code}
nums={test_input.get('nums')}
target={test_input.get('target')}
print(json.dumps(sorted(twoSum(nums,target))))
"""

        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(runner)
            file_path = f.name

        result = subprocess.run(
            ["python", file_path],
            capture_output=True,
            text=True,
            timeout=5
        )

        os.unlink(file_path)

        if result.returncode != 0:
            return None, result.stderr

        return json.loads(result.stdout), None

    except subprocess.TimeoutExpired:
        return None, "Time limit exceeded"
    except Exception as e:
        return None, str(e)


# ───────── RUN CODE ─────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code(request):

    code = request.data.get("code")
    language = request.data.get("language", "python")

    if not code:
        return Response({"error": "No code provided"}, status=400)

    if language != "python":
        return Response({"error": "Only Python supported currently"}, status=400)

    # Dummy test case
    test = {"nums": [2, 7, 11, 15], "target": 9}

    output, error = run_python_code(code, test, "twosum")

    if error:
        return Response({"error": error})

    return Response({"output": output})


# ───────── SUBMIT CODE ─────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):

    code = request.data.get("code")

    if not code:
        return Response({"error": "No code provided"}, status=400)

    test = {"nums": [2, 7, 11, 15], "target": 9}

    output, error = run_python_code(code, test, "twosum")

    if error:
        return Response({"status": "Error", "error": error})

    correct = output == [0, 1]

    progress, _ = Progress.objects.get_or_create(user=request.user)

    progress.submissions += 1
    if correct:
        progress.problems_solved += 1
    progress.save()

    return Response({
        "status": "Accepted" if correct else "Wrong Answer"
    })


# ───────── GOOGLE LOGIN ─────────
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    return Response({"message": "Google login placeholder"})
