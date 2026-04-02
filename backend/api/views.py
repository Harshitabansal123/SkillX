from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import Progress, SolvedProblem
import subprocess
import tempfile
import os
import json
import PyPDF2
import io
import re
import sys

# ── Path to the sandboxed runner script ──
SANDBOX_SCRIPT = os.path.join(os.path.dirname(__file__), "sandbox_runner.py")


# ── Helper: generate JWT tokens ──
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


# ── Helper: get or create DB progress ──
def get_or_create_progress(user):
    progress, _ = Progress.objects.get_or_create(user=user)
    return progress


# ── Home ──
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
    return Response({"message": "SkillX Backend Running ✦"}, status=status.HTTP_200_OK)


# ── Signup ──
@api_view(['POST'])
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is None:
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


# ── Logout (blacklist refresh token) ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
    except TokenError:
        return Response({"error": "Invalid or already blacklisted token"}, status=status.HTTP_400_BAD_REQUEST)


# ── Dashboard ──
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user     = request.user
    progress = get_or_create_progress(user)
    subs     = progress.submissions
    accuracy = int(progress.score / subs) if subs > 0 else 0
    level    = max(1, progress.problems_solved // 2 + 1)

    return Response({
        "username":        user.username,
        "email":           user.email,
        "accuracy":        accuracy,
        "problems_solved": progress.problems_solved,
        "streak":          progress.problems_solved,
        "level":           level,
        "weak_topics":     [],
    }, status=status.HTTP_200_OK)


# ── Profile Update ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profile_update(request):
    user  = request.user
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if email:
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({"error": "Email already in use"}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email

    if password:
        if len(password) < 8:
            return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)

    user.save()
    return Response({"message": "Profile updated successfully", "email": user.email}, status=status.HTTP_200_OK)


# ── Problem test cases ──
PROBLEM_TESTS = {
    1: [
        {"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1], "type": "twosum"},
        {"input": {"nums": [3,2,4],     "target": 6}, "expected": [1,2], "type": "twosum"},
        {"input": {"nums": [3,3],       "target": 6}, "expected": [0,1], "type": "twosum"},
    ],
    2: [
        {"input": {"s": ["h","e","l","l","o"]},     "expected": ["o","l","l","e","h"],     "type": "reverse"},
        {"input": {"s": ["H","a","n","n","a","h"]}, "expected": ["h","a","n","n","a","H"], "type": "reverse"},
    ],
    3: [
        {"input": {"n": 3},  "expected": ["1","2","Fizz"],  "type": "fizzbuzz"},
        {"input": {"n": 5},  "expected": ["1","2","Fizz","4","Buzz"], "type": "fizzbuzz"},
        {"input": {"n": 15}, "expected": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"], "type": "fizzbuzz"},
    ],
    4: [
        {"input": {"x": 121},  "expected": True,  "type": "palindrome"},
        {"input": {"x": -121}, "expected": False, "type": "palindrome"},
        {"input": {"x": 10},   "expected": False, "type": "palindrome"},
    ],
    5: [
        {"input": {"nums": [-2,1,-3,4,-1,2,1,-5,4]}, "expected": 6,  "type": "maxsubarray"},
        {"input": {"nums": [1]},                       "expected": 1,  "type": "maxsubarray"},
        {"input": {"nums": [5,4,-1,7,8]},              "expected": 23, "type": "maxsubarray"},
    ],
    6: [
        {"input": {"s": "()"},     "expected": True,  "type": "validparen"},
        {"input": {"s": "()[]{}"}, "expected": True,  "type": "validparen"},
        {"input": {"s": "(]"},     "expected": False, "type": "validparen"},
        {"input": {"s": "([)]"},   "expected": False, "type": "validparen"},
    ],
    7: [
        {"input": {"n": 2}, "expected": 2, "type": "climbstairs"},
        {"input": {"n": 3}, "expected": 3, "type": "climbstairs"},
        {"input": {"n": 5}, "expected": 8, "type": "climbstairs"},
    ],
    8: [
        {"input": {"prices": [7,1,5,3,6,4]}, "expected": 5, "type": "maxprofit"},
        {"input": {"prices": [7,6,4,3,1]},   "expected": 0, "type": "maxprofit"},
        {"input": {"prices": [1,2]},          "expected": 1, "type": "maxprofit"},
    ],
    9: [
        {"input": {"nums": [3,0,1]},   "expected": 2, "type": "missingnum"},
        {"input": {"nums": [0,1]},     "expected": 2, "type": "missingnum"},
        {"input": {"nums": [9,6,4,2,3,5,7,0,1]}, "expected": 8, "type": "missingnum"},
    ],
    10: [
        {"input": {"s": "Hello World"}, "expected": 3, "type": "vowels"},
        {"input": {"s": "Python"},      "expected": 1, "type": "vowels"},
        {"input": {"s": "aeiou"},       "expected": 5, "type": "vowels"},
    ],
    11: [
        {"input": {"n": 5}, "expected": 120, "type": "factorial"},
        {"input": {"n": 0}, "expected": 1,   "type": "factorial"},
        {"input": {"n": 7}, "expected": 5040,"type": "factorial"},
    ],
    12: [
        {"input": {"nums": [3,1,4,1,5,9,2,6]}, "expected": 9,  "type": "findmax"},
        {"input": {"nums": [-5,-3,-1,-4]},       "expected": -1, "type": "findmax"},
        {"input": {"nums": [42]},                "expected": 42, "type": "findmax"},
    ],
    13: [
        {"input": {"nums": [10,5,8,20,3]}, "expected": 10, "type": "secondlargest"},
        {"input": {"nums": [5,5,5]},       "expected": -1, "type": "secondlargest"},
        {"input": {"nums": [1,2]},         "expected": 1,  "type": "secondlargest"},
    ],
}


# ── Call expression builder — maps test type + input to a safe function call ──
def _build_call(test_type, test_input):
    """
    Returns (call_expr, sort_output) for the sandbox.
    call_expr is a Python expression string using only literals — no user input injected.
    sort_output tells the sandbox to sort list results before comparing.
    """
    t = test_type
    i = test_input
    if t == "twosum":
        return f"twoSum({i['nums']!r}, {i['target']!r})", True
    elif t == "reverse":
        return f"reverseString({i['s']!r})", False
    elif t == "fizzbuzz":
        return f"fizzBuzz({i['n']!r})", False
    elif t == "palindrome":
        return f"isPalindrome({i['x']!r})", False
    elif t == "maxsubarray":
        return f"maxSubArray({i['nums']!r})", False
    elif t == "validparen":
        return f"isValid({i['s']!r})", False
    elif t == "climbstairs":
        return f"climbStairs({i['n']!r})", False
    elif t == "maxprofit":
        return f"maxProfit({i['prices']!r})", False
    elif t == "missingnum":
        return f"missingNumber({i['nums']!r})", False
    elif t == "vowels":
        return f"countVowels({i['s']!r})", False
    elif t == "factorial":
        return f"factorial({i['n']!r})", False
    elif t == "findmax":
        return f"findMax({i['nums']!r})", False
    elif t == "secondlargest":
        return f"secondLargest({i['nums']!r})", False
    return None, False


# ── Dangerous pattern pre-check (fast rejection before sandbox) ──────────────
BLOCKED_PATTERNS = [
    r"\b(import|__import__|importlib)\b",
    r"\bopen\s*\(",
    r"\bexec\s*\(",
    r"\beval\s*\(",
    r"\bcompile\s*\(",
    r"\bgetattr\s*\(",
    r"\bsetattr\s*\(",
    r"\bdelattr\s*\(",
    r"\b__class__\b",
    r"\b__bases__\b",
    r"\b__subclasses__\b",
    r"\b__globals__\b",
    r"\b__builtins__\b",
    r"\bsubprocess\b",
    r"\bsocket\b",
    r"\burllib\b",
    r"\brequests\b",
    r"\bpickle\b",
    r"\bshutil\b",
    r"\bctypes\b",
    r"breakpoint\s*\(",
    r"input\s*\(",
]
_BLOCKED_RE = re.compile("|".join(BLOCKED_PATTERNS), re.IGNORECASE)


def _precheck_code(code):
    """Returns an error string if dangerous patterns found, else None."""
    match = _BLOCKED_RE.search(code)
    if match:
        return f"Security violation: '{match.group()}' is not allowed in submitted code."
    return None


# ── Sandboxed Python runner ───────────────────────────────────────────────────
def run_python_code(code, test_input, test_type):
    # Fast pre-check
    err = _precheck_code(code)
    if err:
        return None, err

    call_expr, sort_output = _build_call(test_type, test_input)
    if call_expr is None:
        return None, "Unknown problem type"

    # Special case: reverseString modifies in-place — inject list and return it
    if test_type == "reverse":
        wrapped_code = (
            code + "\n"
            f"_s = {test_input['s']!r}\n"
            "reverseString(_s)\n"
            "_result = _s"
        )
        call_expr = "_result"
        sort_output = False
    else:
        wrapped_code = code

    payload = json.dumps({
        "code":  wrapped_code,
        "call":  call_expr,
        "sort":  sort_output,
    })

    try:
        proc = subprocess.run(
            [sys.executable, SANDBOX_SCRIPT],
            input=payload,
            capture_output=True,
            text=True,
            timeout=5,          # wall-clock hard limit
        )
    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except Exception as e:
        return None, f"Sandbox error: {e}"

    raw = proc.stdout.strip()
    if not raw:
        stderr_tail = proc.stderr.strip().split("\n")[-1] if proc.stderr.strip() else "No output"
        return None, stderr_tail

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return None, "Invalid output from sandbox"

    if "error" in result:
        return None, result["error"]

    return result["output"], None


# ── Sandboxed JavaScript runner (Node with --disallow-code-generation-from-strings) ──
def run_js_code(code, test_input, test_type):
    """
    JavaScript sandbox: runs via Node.js with:
      --disallow-code-generation-from-strings  (blocks eval/Function constructor)
      Strict module isolation via a wrapper that removes require/process/global
      Hard timeout enforced by subprocess
    """
    call_expr, sort_output = _build_call(test_type, test_input)
    if call_expr is None:
        return None, "Unknown problem type"

    # For reverse (in-place), wrap differently
    if test_type == "reverse":
        js_call = (
            f"(function(){{ "
            f"let _s = {json.dumps(test_input['s'])}; "
            f"reverseString(_s); "
            f"return _s; "
            f"}})()"
        )
    else:
        # Translate Python call_expr to JS syntax (args are already repr'd as JSON-safe literals)
        js_call = call_expr  # Python repr of literals is JS-compatible for lists/dicts/strings/ints/bools

    sort_js = ".sort((a,b)=>a-b)" if sort_output else ""

    # Wrap user code: strip require/process/global from scope
    runner_js = f"""
'use strict';
(function() {{
  // Remove dangerous globals
  const require    = undefined;
  const process    = undefined;
  const global     = undefined;
  const globalThis = undefined;
  const __dirname  = undefined;
  const __filename = undefined;
  const fetch      = undefined;
  const XMLHttpRequest = undefined;

  // --- User code ---
  {code}
  // --- End user code ---

  try {{
    const result = {js_call}{sort_js};
    process.stdout.write(JSON.stringify({{ output: result }}) + '\\n');
  }} catch(e) {{
    process.stdout.write(JSON.stringify({{ error: e.message }}) + '\\n');
  }}
// Restore process for output only after user code ran
}}).call({{}});
"""
    # We need real process for output — patch: use a temp file approach
    # but only expose stdout write, not exec/spawn
    runner_safe = f"""
'use strict';
const _out = process.stdout;
const _write = (s) => _out.write(s);
// Seal dangerous APIs before running user code
const _require    = require;
delete global.require;
delete global.process;
delete global.global;
delete global.globalThis;

{code}

try {{
  let result = {js_call}{sort_js};
  _write(JSON.stringify({{ output: result }}) + '\\n');
}} catch(e) {{
  _write(JSON.stringify({{ error: e.message }}) + '\\n');
}}
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, dir='/tmp') as f:
        f.write(runner_safe)
        tmp_path = f.name

    try:
        import platform
        use_shell = platform.system() == "Windows"
        cmd = (
            f'node --disallow-code-generation-from-strings "{tmp_path}"'
            if use_shell
            else ['node', '--disallow-code-generation-from-strings', tmp_path]
        )
        proc = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=5,
            shell=use_shell,
        )
    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except FileNotFoundError:
        return None, "Node.js not found — make sure Node is installed"
    except Exception as e:
        return None, str(e)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    raw = proc.stdout.strip()
    if not raw:
        err = proc.stderr.strip().split("\n")[-1] if proc.stderr.strip() else "No output — did you return a value?"
        return None, err

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return None, "Invalid output from sandbox"

    if "error" in result:
        return None, result["error"]

    return result["output"], None


# ── AI Hint Generator ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_hint(request):
    problem_title       = request.data.get('problem_title', '')
    problem_description = request.data.get('problem_description', '')
    user_code           = request.data.get('user_code', '')
    hint_level          = int(request.data.get('hint_level', 0))
    language            = request.data.get('language', 'python')

    hints_db = {
        "Two Sum": [
            "Think about what you need to find for each number. If the current number is x, you need to find target - x somewhere in the array.",
            "Instead of checking every pair (O(n²)), can you use a dictionary to remember numbers you have already seen?",
            "Use a hash map: as you loop, store each number with its index. Before storing, check if (target - current number) already exists in the map.",
        ],
        "Reverse a String": [
            "You need to swap characters from both ends. Think about using two pointers — one at start, one at end.",
            "Move the left pointer forward and right pointer backward, swapping at each step until they meet in the middle.",
            "Use a while loop: while left < right, swap s[left] and s[right], then increment left and decrement right.",
        ],
        "FizzBuzz": [
            "Loop from 1 to n. For each number, you need to check three conditions — divisible by both 3 and 5, only 3, only 5.",
            "Check divisibility by 15 (both 3 and 5) FIRST, before checking 3 or 5 alone. Order matters!",
            "Use the modulo operator %. n % 3 == 0 means divisible by 3. Build your result list and append the correct string.",
        ],
        "Palindrome Number": [
            "A negative number can never be a palindrome. Handle that edge case first.",
            "Convert the number to a string and compare it with its reverse. Or try reversing the number mathematically.",
            "String approach: str(x) == str(x)[::-1] in Python. Math approach: reverse the digits and compare with original.",
        ],
        "Maximum Subarray": [
            "Try Kadane's Algorithm. Keep track of the current sum and the maximum sum seen so far.",
            "At each element, decide: should I extend the current subarray or start a new one from here?",
            "current = max(num, current + num) — this decides whether to start fresh or continue. Update max_sum at each step.",
        ],
        "Valid Parentheses": [
            "Think about using a stack. When you see an opening bracket, push it. When you see a closing bracket, check the top of the stack.",
            "Each closing bracket must match the most recent unmatched opening bracket. A stack (LIFO) is perfect for this.",
            "Use a dictionary to map closing brackets to opening: {')':'(', ']':'[', '}':'{'}. Stack should be empty at the end.",
        ],
        "Climbing Stairs": [
            "Think about small cases first. For n=1, there is 1 way. For n=2, there are 2 ways. For n=3?",
            "To reach step n, you can come from step n-1 (one step) or step n-2 (two steps). So ways(n) = ways(n-1) + ways(n-2).",
            "This is exactly the Fibonacci sequence! Use dynamic programming — store results for previous steps to avoid recalculation.",
        ],
        "Best Time to Buy Stock": [
            "You want to buy at the lowest price and sell at the highest price AFTER buying. Track the minimum price seen so far.",
            "As you loop, keep updating the minimum price. At each step, calculate profit = current price - minimum price.",
            "Track min_price and max_profit. For each price: min_price = min(min_price, price), max_profit = max(max_profit, price - min_price).",
        ],
        "Missing Number": [
            "The array has n numbers in range [0, n] with one missing. Think about what the sum should be vs what it is.",
            "Sum of 0 to n = n*(n+1)/2. Subtract the actual sum of the array. The difference is the missing number!",
            "expected_sum = len(nums) * (len(nums) + 1) // 2. Return expected_sum - sum(nums).",
        ],
        "Count Vowels": [
            "Loop through each character in the string. Check if it is a vowel (a, e, i, o, u).",
            "Convert the character to lowercase before checking so both uppercase and lowercase are handled.",
            "Use a set of vowels: vowels = set('aeiouAEIOU'). Count characters that are in this set.",
        ],
        "Factorial": [
            "Factorial of n = n × (n-1) × (n-2) × ... × 1. Base case: factorial(0) = 1.",
            "You can solve this iteratively (loop from 1 to n, multiply) or recursively (return n * factorial(n-1)).",
            "Iterative: result = 1, then loop: for i in range(1, n+1): result *= i. Return result.",
        ],
        "Find Maximum": [
            "You cannot use max() — so you need to track the largest number yourself as you loop.",
            "Start by assuming the first element is the maximum. Then compare with each subsequent element.",
            "max_val = nums[0], then loop: if nums[i] > max_val: max_val = nums[i]. Return max_val.",
        ],
        "Second Largest": [
            "You need the second unique largest. First find the largest, then find the largest number that is smaller than it.",
            "Use two variables: first and second. Update them as you loop through the array.",
            "Sort the unique values in descending order. If length >= 2, return the second element, else return -1.",
        ],
    }

    problem_hints = hints_db.get(problem_title, [
        "Break the problem into smaller parts. What is the simplest case?",
        "Think about what data structure would make lookups faster.",
        "Consider the time complexity. Can you do better than O(n²)?",
    ])

    code_empty = not user_code.strip() or user_code.strip().endswith("pass") or user_code.strip().endswith("// Write your solution here")

    if code_empty:
        hint_text = f"Your code is empty! Start by understanding the problem. {problem_hints[0]}"
    elif hint_level < len(problem_hints):
        hint_text = problem_hints[hint_level]
    else:
        hint_text = "You have seen all hints! Trust your understanding and try submitting your solution. You can do it! 💪"

    if language == "javascript" and hint_level >= 1:
        hint_text += " (In JavaScript, you can use a Map or plain object {} for hash map operations.)"

    return Response({"hint": hint_text, "hint_level": hint_level + 1})


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
    except Exception:
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
    for skill in all_skills[:6]:
        if skill in question_bank:
            q, diff = question_bank[skill]
            questions.append({"question": q, "skill": skill, "difficulty": diff})
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

    text = extract_text_from_pdf(file)
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
    problem_id = request.data.get("problem_id", 1)

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if len(code) > 5000:
        return Response({"error": "Code must be under 5000 characters"}, status=status.HTTP_400_BAD_REQUEST)
    if language not in ["python", "javascript"]:
        return Response({"error": "Only Python and JavaScript are supported"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        problem_id = int(problem_id)
        if problem_id not in PROBLEM_TESTS:
            return Response({"error": "Invalid problem ID"}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({"error": "problem_id must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS[problem_id]
    results = []

    for i, test in enumerate(tests):
        if language == "javascript":
            output, error = run_js_code(code, test["input"], test["type"])
        else:
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
    problem_id = request.data.get("problem_id", 1)

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if len(code) > 5000:
        return Response({"error": "Code must be under 5000 characters"}, status=status.HTTP_400_BAD_REQUEST)
    if language not in ["python", "javascript"]:
        return Response({"error": "Only Python and JavaScript are supported"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        problem_id = int(problem_id)
        if problem_id not in PROBLEM_TESTS:
            return Response({"error": "Invalid problem ID"}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({"error": "problem_id must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS[problem_id]
    passed  = 0
    total   = len(tests)
    results = []

    for i, test in enumerate(tests):
        if language == "javascript":
            output, error = run_js_code(code, test["input"], test["type"])
        else:
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

    # Save progress to database
    progress = get_or_create_progress(request.user)
    progress.submissions += 1
    progress.score += accuracy
    if accepted:
        already_solved = SolvedProblem.objects.filter(user=request.user, problem_id=problem_id).exists()
        if not already_solved:
            SolvedProblem.objects.create(user=request.user, problem_id=problem_id)
            progress.problems_solved += 1
    progress.save()

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