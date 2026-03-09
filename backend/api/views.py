from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Progress

import subprocess
import tempfile
import os
import json


# ── Helper: generate JWT tokens ──
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ── Home ──
@api_view(['GET'])
def home(request):
    return Response({"message": "SkillX Backend Running ✦"})


# ── Signup ──
@api_view(['POST'])
def signup(request):

    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not username or not email or not password:
        return Response({"error": "Username, email and password are required"}, status=400)

    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)

    tokens = get_tokens(user)

    # create progress entry
    Progress.objects.get_or_create(user=user)

    return Response({
        "message": "Account created successfully",
        "token": tokens["access"],
        "refresh": tokens["refresh"],
        "username": user.username,
        "email": user.email,
    }, status=201)


# ── Login ──
@api_view(['POST'])
def login(request):

    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user:
        tokens = get_tokens(user)

        return Response({
            "message": "Login successful",
            "token": tokens["access"],
            "refresh": tokens["refresh"],
            "username": user.username,
            "email": user.email,
        })

    return Response({"error": "Invalid username or password"}, status=401)


# ── Dashboard ──
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):

    user = request.user

    progress, _ = Progress.objects.get_or_create(user=user)

    solved = progress.problems_solved
    subs = progress.submissions

    accuracy = int(progress.score / subs) if subs > 0 else 0
    level = max(1, solved // 2 + 1)

    return Response({
        "username": user.username,
        "email": user.email,
        "accuracy": accuracy,
        "problems_solved": solved,
        "streak": solved,
        "level": level,
        "weak_topics": []
    })


# ── Problem test cases ──
PROBLEM_TESTS = {
    1: [
        {"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1]},
        {"input": {"nums": [3,2,4], "target": 6}, "expected": [1,2]},
        {"input": {"nums": [3,3], "target": 6}, "expected": [0,1]},
    ]
}


# ── Security check for dangerous code ──
FORBIDDEN_KEYWORDS = [
    "import os",
    "import sys",
    "import subprocess",
    "import socket",
    "import shutil",
    "open(",
    "exec(",
    "eval("
]


# ── Run user code ──
def run_python_code(code, test_input):

    # Basic sandbox protection
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in code:
            return None, "Forbidden operation detected"

    try:

        runner = f"""
import json
{code}
nums={test_input['nums']}
target={test_input['target']}
print(json.dumps(sorted(twoSum(nums,target))))
"""

        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(runner)
            tmp_path = f.name

        proc = subprocess.run(
            ["python", tmp_path],
            capture_output=True,
            text=True,
            timeout=5
        )

        os.unlink(tmp_path)

        if proc.returncode != 0:
            return None, proc.stderr.strip()

        return json.loads(proc.stdout.strip()), None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"

    except Exception as e:
        return None, str(e)


# ── Run Code ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code(request):

    code = request.data.get("code", "").strip()
    problem_id = int(request.data.get("problem_id", 1))

    tests = PROBLEM_TESTS.get(problem_id, [])

    results = []

    for test in tests:

        output, error = run_python_code(code, test["input"])

        if error:
            results.append({"passed": False, "error": error})
        else:
            results.append({"passed": output == test["expected"]})

    return Response({"results": results})


# ── Submit Code ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):

    code = request.data.get("code", "").strip()
    problem_id = int(request.data.get("problem_id", 1))

    tests = PROBLEM_TESTS.get(problem_id, [])

    passed = 0
    total = len(tests)

    for test in tests:

        output, error = run_python_code(code, test["input"])

        if not error and output == test["expected"]:
            passed += 1

    accuracy = int((passed / total) * 100) if total else 0
    accepted = passed == total

    progress, _ = Progress.objects.get_or_create(user=request.user)

    progress.submissions += 1
    progress.score += accuracy

    if accepted:
        progress.problems_solved += 1

    progress.save()

    return Response({
        "status": "Accepted" if accepted else "Wrong Answer",
        "score": accuracy,
        "passed": passed,
        "total": total,
        "runtime": "~50ms",
        "memory": "14MB"
    })


# ── Resume Upload ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    return Response({"message": "Resume upload working"})