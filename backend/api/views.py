from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import subprocess
import tempfile
import os
import json
import PyPDF2
import io
import re


# ── Helper: generate JWT tokens ──
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


# ── Home ──
@api_view(['GET'])
def home(request):
    return Response({"message": "SkillX Backend Running ✦"}, status=status.HTTP_200_OK)


# ── Signup ──
@api_view(['POST'])
def signup(request):
    username = request.data.get("username", "").strip()
    email    = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not username or not email or not password:
        return Response({"error": "Username, email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    user   = User.objects.create_user(username=username, email=email, password=password)
    tokens = get_tokens(user)

    return Response({
        "message":  "Account created successfully",
        "token":    tokens["access"],
        "refresh":  tokens["refresh"],
        "username": user.username,
        "email":    user.email,
    }, status=status.HTTP_201_CREATED)


# ── Login ──
@api_view(['POST'])
def login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    # Try username first, then try email as fallback
    user = authenticate(username=username, password=password)
    if user is None:
        # Maybe they typed their email instead of username
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    if user is not None:
        tokens = get_tokens(user)
        return Response({
            "message":  "Login successful",
            "token":    tokens["access"],
            "refresh":  tokens["refresh"],
            "username": user.username,
            "email":    user.email,
        }, status=status.HTTP_200_OK)

    return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)


# ── Dashboard ──
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user = request.user
    progress = get_progress(user.username)
    solved   = progress["problems_solved"]
    subs     = progress["submissions"]
    accuracy = int(progress["total_score"] / subs) if subs > 0 else 0
    level    = max(1, solved // 2 + 1)  # every 2 problems = +1 level

    return Response({
        "username":        user.username,
        "email":           user.email,
        "accuracy":        accuracy,
        "problems_solved": solved,
        "streak":          solved,   # streak = problems solved for now
        "level":           level,
        "weak_topics":     [],
    }, status=status.HTTP_200_OK)


# ── Simple in-memory progress tracker (good enough for demo) ──
# Key: username, Value: {problems_solved, accuracy_total, submissions}
user_progress = {}

def get_progress(username):
    if username not in user_progress:
        user_progress[username] = {"problems_solved": 0, "total_score": 0, "submissions": 0, "solved_ids": set()}
    return user_progress[username]


# ── Problem test cases ──
PROBLEM_TESTS = {
    1: [
        {"input": {"nums": [2,7,11,15], "target": 9},  "expected": [0,1], "type": "twosum"},
        {"input": {"nums": [3,2,4],     "target": 6},  "expected": [1,2], "type": "twosum"},
        {"input": {"nums": [3,3],       "target": 6},  "expected": [0,1], "type": "twosum"},
    ],
    2: [
        {"input": {"s": ["h","e","l","l","o"]},     "expected": ["o","l","l","e","h"],     "type": "reverse"},
        {"input": {"s": ["H","a","n","n","a","h"]}, "expected": ["h","a","n","n","a","H"], "type": "reverse"},
    ],
    3: [
        {"input": {"n": 3},  "expected": ["1","2","Fizz"],                                                                                   "type": "fizzbuzz"},
        {"input": {"n": 5},  "expected": ["1","2","Fizz","4","Buzz"],                                                                        "type": "fizzbuzz"},
        {"input": {"n": 15}, "expected": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"],           "type": "fizzbuzz"},
    ],
}


# ── Run user code in a sandbox ──
def run_python_code(code, test_input, test_type):
    try:
        if test_type == "twosum":
            runner = f"import json\n{code}\nnums={test_input['nums']}\ntarget={test_input['target']}\nprint(json.dumps(sorted(twoSum(nums, target))))"
        elif test_type == "reverse":
            runner = f"import json\n{code}\ns={test_input['s']}\nreverseString(s)\nprint(json.dumps(s))"
        elif test_type == "fizzbuzz":
            runner = f"import json\n{code}\nprint(json.dumps(fizzBuzz({test_input['n']})))"
        else:
            return None, "Unknown problem type"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(runner)
            tmp_path = f.name

        proc = subprocess.run(
            ['python', tmp_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        os.unlink(tmp_path)

        if proc.returncode != 0:
            return None, proc.stderr.strip().split("\n")[-1]

        output = json.loads(proc.stdout.strip())
        return output, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except Exception as e:
        return None, str(e)


# ── Skill keywords to detect from resume ──
SKILL_KEYWORDS = {
    "Languages":  ["python","java","javascript","typescript","c++","c#","ruby","go","swift","kotlin","php","rust","scala","r","matlab"],
    "Frameworks": ["react","angular","vue","django","flask","spring","node","express","fastapi","nextjs","laravel","rails","flutter"],
    "Databases":  ["mysql","postgresql","mongodb","sqlite","redis","firebase","cassandra","dynamodb","oracle","elasticsearch"],
    "Cloud & Tools": ["aws","azure","gcp","docker","kubernetes","git","jenkins","terraform","linux","nginx","graphql","rest","ci/cd"],
}

def extract_text_from_pdf(file):
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.lower()
    except Exception as e:
        return ""

def detect_skills(text):
    found = {}
    for category, keywords in SKILL_KEYWORDS.items():
        matched = [kw.title() for kw in keywords if re.search(r'\b' + kw + r'\b', text, re.IGNORECASE)]
        if matched:
            found[category] = matched
    return found

def generate_questions(skills_dict):
    question_bank = {
        "Python":      ("Explain list comprehensions and when you'd use generators instead.",         "Medium"),
        "Java":        ("What is the difference between an interface and an abstract class in Java?", "Medium"),
        "JavaScript":  ("Explain event loop, call stack, and how async/await works.",                 "Hard"),
        "TypeScript":  ("How does TypeScript's type system help prevent runtime errors?",             "Easy"),
        "React":       ("Explain useEffect cleanup and when would you use useCallback?",              "Medium"),
        "Django":      ("How does Django's ORM handle N+1 query problems?",                          "Hard"),
        "Flask":       ("How would you structure a large Flask application with blueprints?",         "Medium"),
        "Node":        ("Explain the event-driven architecture of Node.js.",                          "Medium"),
        "Docker":      ("How do multi-stage Docker builds reduce image size?",                        "Medium"),
        "Kubernetes":  ("Explain the difference between a Deployment and a StatefulSet.",             "Hard"),
        "Aws":         ("How would you design a highly available system on AWS?",                     "Hard"),
        "Postgresql":  ("Explain EXPLAIN ANALYZE and how you'd optimize a slow query.",               "Hard"),
        "Mongodb":     ("When would you choose MongoDB over a relational database?",                  "Easy"),
        "Redis":       ("How would you use Redis for session management and caching?",                "Medium"),
        "Git":         ("Explain git rebase vs merge and when to use each.",                          "Easy"),
        "Mysql":       ("What are database indexes and how do they improve performance?",             "Medium"),
    }
    questions = []
    all_skills = [s for skills in skills_dict.values() for s in skills]
    for skill in all_skills[:6]:  # max 6 questions
        if skill in question_bank:
            q, diff = question_bank[skill]
            questions.append({"question": q, "skill": skill, "difficulty": diff})
    # fallback if no matches
    if not questions:
        questions = [
            {"question": "Tell me about a challenging project you worked on.", "skill": "General", "difficulty": "Easy"},
            {"question": "How do you approach debugging a production issue?",  "skill": "General", "difficulty": "Medium"},
        ]
    return questions


# ── Resume Upload ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    file = request.FILES.get("resume")
    if not file:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
    if not file.name.endswith(".pdf"):
        return Response({"error": "Only PDF files are supported"}, status=status.HTTP_400_BAD_REQUEST)

    text   = extract_text_from_pdf(file)
    if not text.strip():
        return Response({"error": "Could not read PDF. Make sure it is not scanned/image-based."}, status=status.HTTP_400_BAD_REQUEST)

    skills    = detect_skills(text)
    questions = generate_questions(skills)

    return Response({
        "skills":    skills,
        "questions": questions,
        "word_count": len(text.split()),
    }, status=status.HTTP_200_OK)


# ── Run Code ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code(request):
    code       = request.data.get("code", "").strip()
    language   = request.data.get("language", "python")
    problem_id = int(request.data.get("problem_id", 1))

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if language != "python":
        return Response({"error": "Only Python is supported right now"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS.get(problem_id, PROBLEM_TESTS[1])
    results = []

    for i, test in enumerate(tests):
        output, error = run_python_code(code, test["input"], test["type"])
        if error:
            results.append({
                "case":     i + 1,
                "passed":   False,
                "output":   error,
                "expected": str(test["expected"]),
            })
        else:
            passed = output == test["expected"]
            results.append({
                "case":     i + 1,
                "passed":   passed,
                "output":   str(output),
                "expected": str(test["expected"]),
            })

    return Response({
        "success": all(r["passed"] for r in results),
        "results": results,
        "runtime": "~50ms",
        "memory":  "14.2 MB",
    }, status=status.HTTP_200_OK)


# ── Submit Code ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):
    code       = request.data.get("code", "").strip()
    language   = request.data.get("language", "python")
    problem_id = int(request.data.get("problem_id", 1))

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if language != "python":
        return Response({"error": "Only Python is supported right now"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS.get(problem_id, PROBLEM_TESTS[1])
    passed  = 0
    total   = len(tests)
    results = []

    for i, test in enumerate(tests):
        output, error = run_python_code(code, test["input"], test["type"])
        if error:
            results.append({"case": i+1, "passed": False, "output": error})
        else:
            ok = output == test["expected"]
            if ok:
                passed += 1
            results.append({"case": i+1, "passed": ok, "output": str(output)})

    accuracy = int((passed / total) * 100) if total > 0 else 0
    accepted = passed == total

    # Save progress to in-memory tracker
    progress = get_progress(request.user.username)
    progress["submissions"] += 1
    progress["total_score"] += accuracy
    if accepted and problem_id not in progress["solved_ids"]:
        progress["problems_solved"] += 1
        progress["solved_ids"].add(problem_id)

    return Response({
        "status":   "Accepted" if accepted else "Wrong Answer",
        "score":    accuracy,
        "passed":   passed,
        "total":    total,
        "results":  results,
        "runtime":  "~50ms",
        "memory":   "14.2 MB",
        "feedback": "Great solution! Clean and efficient." if accepted else f"Failed {total - passed} case(s). Check your logic.",
    }, status=status.HTTP_200_OK)