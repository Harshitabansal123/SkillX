from .validators import sanitize_username, sanitize_code_input, sanitize_email, validate_password_strength
from .validators import sanitize_username, sanitize_code_input
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Progress, SolvedProblem
from .permissions import IsOwnerOrAdmin          # authorization helper
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import subprocess
import tempfile
import os
import json
import PyPDF2
import io
import re
import sys



# ── Helper: generate JWT tokens ──
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


# ── Home ──
@api_view(['GET'])
@permission_classes([AllowAny])

def home(request):
    return Response({"message": "SkillX Backend Running ✦"}, status=status.HTTP_200_OK)


# ── Signup ──
@api_view(['POST'])
@permission_classes([AllowAny])

def signup(request):
    username = sanitize_username(request.data.get("username", "").strip())
    email = sanitize_email(request.data.get("email", "").strip())
    password = request.data.get("password", "")
    
    if not username or not email or not password:
        return Response({"error": "Username, email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
    validate_password_strength(password)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
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
    username = sanitize_username(request.data.get("username", "").strip())
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
@permission_classes([IsOwnerOrAdmin])
def dashboard(request):
    user = request.user
    # Object-level check: admins may pass ?username= to view another user's dash
    target_username = request.query_params.get("username")
    if target_username and target_username != user.username:
        from .permissions import is_admin
        if not is_admin(user):
            return Response(
                {"error": "You are not authorised to view another user's dashboard."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
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

# ── Database-backed progress tracker ──
def get_progress(username):
    user = User.objects.get(username=username)
    progress, _ = Progress.objects.get_or_create(user=user)
    solved_ids = set(SolvedProblem.objects.filter(user=user).values_list('problem_id', flat=True))
    return {
        "problems_solved": progress.problems_solved,
        "total_score": progress.score,
        "submissions": progress.submissions,
        "solved_ids": solved_ids
    }


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


# ── Run user code in a sandbox ──
def run_python_code(code, test_input, test_type):
    try:
        if test_type == "twosum":
            runner = f"import json\n{code}\nnums={test_input['nums']}\ntarget={test_input['target']}\nprint(json.dumps(sorted(twoSum(nums, target))))"
        elif test_type == "reverse":
            runner = f"import json\n{code}\ns={test_input['s']}\nreverseString(s)\nprint(json.dumps(s))"
        elif test_type == "fizzbuzz":
            runner = f"import json\n{code}\nprint(json.dumps(fizzBuzz({test_input['n']})))"
        elif test_type == "palindrome":
            runner = f"import json\n{code}\nprint(json.dumps(isPalindrome({test_input['x']})))"
        elif test_type == "maxsubarray":
            runner = f"import json\n{code}\nprint(json.dumps(maxSubArray({test_input['nums']})))"
        elif test_type == "validparen":
            runner = f"import json\n{code}\nprint(json.dumps(isValid({repr(test_input['s'])})))"
        elif test_type == "climbstairs":
            runner = f"import json\n{code}\nprint(json.dumps(climbStairs({test_input['n']})))"
        elif test_type == "maxprofit":
            runner = f"import json\n{code}\nprint(json.dumps(maxProfit({test_input['prices']})))"
        elif test_type == "missingnum":
            runner = f"import json\n{code}\nprint(json.dumps(missingNumber({test_input['nums']})))"
        elif test_type == "vowels":
            runner = f"import json\n{code}\nprint(json.dumps(countVowels({repr(test_input['s'])})))"
        elif test_type == "factorial":
            runner = f"import json\n{code}\nprint(json.dumps(factorial({test_input['n']})))"
        elif test_type == "findmax":
            runner = f"import json\n{code}\nprint(json.dumps(findMax({test_input['nums']})))"
        elif test_type == "secondlargest":
            runner = f"import json\n{code}\nprint(json.dumps(secondLargest({test_input['nums']})))"
        else:
            return None, "Unknown problem type"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(runner)
            tmp_path = f.name

        proc = subprocess.run(
        [sys.executable, tmp_path],
        capture_output=True,
        text=True,
        timeout=5
)

        if proc.returncode != 0:
            return None, proc.stderr.strip().split("\n")[-1]

        output = json.loads(proc.stdout.strip())
        return output, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except Exception as e:
        return None, str(e)


# ── Run JavaScript code ──
def run_js_code(code, test_input, test_type):
    try:
        if test_type == "twosum":
            runner = f"{code}\nconsole.log(JSON.stringify(twoSum({test_input['nums']}, {test_input['target']}).sort((a,b)=>a-b)));"
        elif test_type == "reverse":
            runner = f"{code}\nlet s={test_input['s']};reverseString(s);console.log(JSON.stringify(s));"
        elif test_type == "fizzbuzz":
            runner = f"{code}\nconsole.log(JSON.stringify(fizzBuzz({test_input['n']})));"
        elif test_type == "palindrome":
            runner = f"{code}\nconsole.log(JSON.stringify(isPalindrome({test_input['x']})));"
        elif test_type == "maxsubarray":
            runner = f"{code}\nconsole.log(JSON.stringify(maxSubArray({test_input['nums']})));"
        elif test_type == "validparen":
            runner = f"{code}\nconsole.log(JSON.stringify(isValid({repr(test_input['s'])})));"
        elif test_type == "climbstairs":
            runner = f"{code}\nconsole.log(JSON.stringify(climbStairs({test_input['n']})));"
        elif test_type == "maxprofit":
            runner = f"{code}\nconsole.log(JSON.stringify(maxProfit({test_input['prices']})));"
        elif test_type == "missingnum":
            runner = f"{code}\nconsole.log(JSON.stringify(missingNumber({test_input['nums']})));"
        elif test_type == "vowels":
            runner = f"{code}\nconsole.log(JSON.stringify(countVowels({repr(test_input['s'])})));"
        elif test_type == "factorial":
            runner = f"{code}\nconsole.log(JSON.stringify(factorial({test_input['n']})));"
        elif test_type == "findmax":
            runner = f"{code}\nconsole.log(JSON.stringify(findMax({test_input['nums']})));"
        elif test_type == "secondlargest":
            runner = f"{code}\nconsole.log(JSON.stringify(secondLargest({test_input['nums']})));"
        else:
            return None, "Unknown problem type"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(runner)
            tmp_path = f.name

        # Windows needs shell=True for node
        import platform
        use_shell = platform.system() == "Windows"
        cmd = f'node "{tmp_path}"' if use_shell else ['node', tmp_path]

        proc = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=5,
            shell=use_shell
        )
        os.unlink(tmp_path)

        if proc.returncode != 0:
            err = proc.stderr.strip().split("\n")[-1] if proc.stderr.strip() else "Runtime error"
            return None, err

        out = proc.stdout.strip()
        if not out:
            return None, "No output — did you return the value?"

        output = json.loads(out)
        return output, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except FileNotFoundError:
        return None, "Node.js not found — make sure Node is installed"
    except Exception as e:
        return None, str(e)


# ── Run C code ──
def run_c_code(code, test_input, test_type):
    try:
        import platform
        # Build runner code
        if test_type == "twosum":
            runner = f"""
#include <stdio.h>
#include <stdlib.h>
{code}
int main() {{
    int nums[] = {{{', '.join(map(str, test_input['nums']))}}};
    int target = {test_input['target']};
    int n = sizeof(nums)/sizeof(nums[0]);
    int* result = twoSum(nums, n, target);
    printf("[%d, %d]\n", result[0] < result[1] ? result[0] : result[1], result[0] < result[1] ? result[1] : result[0]);
    return 0;
}}"""
        elif test_type == "fizzbuzz":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    fizzBuzz({test_input['n']});
    return 0;
}}"""
        elif test_type == "factorial":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    printf("%lld\n", factorial({test_input['n']}));
    return 0;
}}"""
        elif test_type == "findmax":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    int nums[] = {{{', '.join(map(str, test_input['nums']))}}};
    int n = sizeof(nums)/sizeof(nums[0]);
    printf("%d\n", findMax(nums, n));
    return 0;
}}"""
        elif test_type == "missingnum":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    int nums[] = {{{', '.join(map(str, test_input['nums']))}}};
    int n = sizeof(nums)/sizeof(nums[0]);
    printf("%d\n", missingNumber(nums, n));
    return 0;
}}"""
        elif test_type == "palindrome":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    printf("%s\n", isPalindrome({test_input['x']}) ? "true" : "false");
    return 0;
}}"""
        elif test_type == "maxsubarray":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    int nums[] = {{{', '.join(map(str, test_input['nums']))}}};
    int n = sizeof(nums)/sizeof(nums[0]);
    printf("%d\n", maxSubArray(nums, n));
    return 0;
}}"""
        elif test_type == "climbstairs":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    printf("%d\n", climbStairs({test_input['n']}));
    return 0;
}}"""
        elif test_type == "maxprofit":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    int prices[] = {{{', '.join(map(str, test_input['prices']))}}};
    int n = sizeof(prices)/sizeof(prices[0]);
    printf("%d\n", maxProfit(prices, n));
    return 0;
}}"""
        elif test_type == "secondlargest":
            runner = f"""
#include <stdio.h>
{code}
int main() {{
    int nums[] = {{{', '.join(map(str, test_input['nums']))}}};
    int n = sizeof(nums)/sizeof(nums[0]);
    printf("%d\n", secondLargest(nums, n));
    return 0;
}}"""
        else:
            return None, "Problem not supported in C yet"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.c', delete=False) as f:
            f.write(runner)
            src_path = f.name

        exe_path = src_path.replace('.c', '.exe')
        use_shell = platform.system() == "Windows"

        # Compile
        compile_proc = subprocess.run(
            f'gcc "{src_path}" -o "{exe_path}"' if use_shell else ['gcc', src_path, '-o', exe_path],
            capture_output=True, text=True, timeout=10, shell=use_shell
        )
        os.unlink(src_path)

        if compile_proc.returncode != 0:
            return None, "Compilation Error: " + compile_proc.stderr.strip().split("\n")[-1]

        # Run
        run_proc = subprocess.run(
            f'"{exe_path}"' if use_shell else [exe_path],
            capture_output=True, text=True, timeout=5, shell=use_shell
        )
        try: os.unlink(exe_path)
        except: pass

        if run_proc.returncode != 0:
            return None, run_proc.stderr.strip() or "Runtime error"

        out = run_proc.stdout.strip()
        if not out:
            return None, "No output"

        # Parse output
        try:
            import json
            return json.loads(out), None
        except:
            try: return int(out), None
            except:
                if out == "true": return True, None
                if out == "false": return False, None
                return out, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except Exception as e:
        return None, str(e)


# ── Run C++ code ──
def run_cpp_code(code, test_input, test_type):
    try:
        import platform
        use_shell = platform.system() == "Windows"

        if test_type == "twosum":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> nums = {{{', '.join(map(str, test_input['nums']))}}};
    int target = {test_input['target']};
    vector<int> result = twoSum(nums, target);
    sort(result.begin(), result.end());
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    return 0;
}}"""
        elif test_type == "fizzbuzz":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<string> result = fizzBuzz({test_input['n']});
    cout << "[";
    for(int i=0;i<result.size();i++) cout << "\"" << result[i] << "\"" << (i<result.size()-1?",":"");
    cout << "]" << endl;
    return 0;
}}"""
        elif test_type == "palindrome":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    cout << (isPalindrome({test_input['x']}) ? "true" : "false") << endl;
    return 0;
}}"""
        elif test_type == "maxsubarray":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> nums = {{{', '.join(map(str, test_input['nums']))}}};
    cout << maxSubArray(nums) << endl;
    return 0;
}}"""
        elif test_type == "climbstairs":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    cout << climbStairs({test_input['n']}) << endl;
    return 0;
}}"""
        elif test_type == "maxprofit":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> prices = {{{', '.join(map(str, test_input['prices']))}}};
    cout << maxProfit(prices) << endl;
    return 0;
}}"""
        elif test_type == "missingnum":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> nums = {{{', '.join(map(str, test_input['nums']))}}};
    cout << missingNumber(nums) << endl;
    return 0;
}}"""
        elif test_type == "factorial":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    cout << factorial({test_input['n']}) << endl;
    return 0;
}}"""
        elif test_type == "findmax":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> nums = {{{', '.join(map(str, test_input['nums']))}}};
    cout << findMax(nums) << endl;
    return 0;
}}"""
        elif test_type == "secondlargest":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    vector<int> nums = {{{', '.join(map(str, test_input['nums']))}}};
    cout << secondLargest(nums) << endl;
    return 0;
}}"""
        elif test_type == "vowels":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    cout << countVowels({repr(test_input['s'])}) << endl;
    return 0;
}}"""
        elif test_type == "validparen":
            runner = f"""
#include <bits/stdc++.h>
using namespace std;
{code}
int main() {{
    cout << (isValid({repr(test_input['s'])}) ? "true" : "false") << endl;
    return 0;
}}"""
        else:
            return None, "Problem not supported in C++ yet"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
            f.write(runner)
            src_path = f.name

        exe_path = src_path.replace('.cpp', '.exe')

        compile_proc = subprocess.run(
            f'g++ "{src_path}" -o "{exe_path}" -std=c++17' if use_shell else ['g++', src_path, '-o', exe_path, '-std=c++17'],
            capture_output=True, text=True, timeout=10, shell=use_shell
        )
        os.unlink(src_path)

        if compile_proc.returncode != 0:
            return None, "Compilation Error: " + compile_proc.stderr.strip().split("\n")[-1]

        run_proc = subprocess.run(
            f'"{exe_path}"' if use_shell else [exe_path],
            capture_output=True, text=True, timeout=5, shell=use_shell
        )
        try: os.unlink(exe_path)
        except: pass

        if run_proc.returncode != 0:
            return None, run_proc.stderr.strip() or "Runtime error"

        out = run_proc.stdout.strip()
        if not out:
            return None, "No output"

        try:
            import json
            return json.loads(out), None
        except:
            try: return int(out), None
            except:
                if out == "true": return True, None
                if out == "false": return False, None
                return out, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except Exception as e:
        return None, str(e)


# ── Run Java code ──
def run_java_code(code, test_input, test_type):
    try:
        import platform
        use_shell = platform.system() == "Windows"

        if test_type == "twosum":
            runner = f"""
import java.util.*;
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] nums = {{{', '.join(map(str, test_input['nums']))}}};
        int target = {test_input['target']};
        int[] result = twoSum(nums, target);
        Arrays.sort(result);
        System.out.println(Arrays.toString(result).replace(" ", ""));
    }}
}}"""
        elif test_type == "fizzbuzz":
            runner = f"""
import java.util.*;
public class Solution {{
    {code}
    public static void main(String[] args) {{
        List<String> result = fizzBuzz({test_input['n']});
        System.out.println(result.toString().replace(", ", ",").replace(" ", ""));
    }}
}}"""
        elif test_type == "factorial":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        System.out.println(factorial({test_input['n']}));
    }}
}}"""
        elif test_type == "palindrome":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        System.out.println(isPalindrome({test_input['x']}));
    }}
}}"""
        elif test_type == "maxsubarray":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] nums = {{{', '.join(map(str, test_input['nums']))}}};
        System.out.println(maxSubArray(nums));
    }}
}}"""
        elif test_type == "climbstairs":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        System.out.println(climbStairs({test_input['n']}));
    }}
}}"""
        elif test_type == "maxprofit":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] prices = {{{', '.join(map(str, test_input['prices']))}}};
        System.out.println(maxProfit(prices));
    }}
}}"""
        elif test_type == "missingnum":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] nums = {{{', '.join(map(str, test_input['nums']))}}};
        System.out.println(missingNumber(nums));
    }}
}}"""
        elif test_type == "findmax":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] nums = {{{', '.join(map(str, test_input['nums']))}}};
        System.out.println(findMax(nums));
    }}
}}"""
        elif test_type == "secondlargest":
            runner = f"""
public class Solution {{
    {code}
    public static void main(String[] args) {{
        int[] nums = {{{', '.join(map(str, test_input['nums']))}}};
        System.out.println(secondLargest(nums));
    }}
}}"""
        else:
            return None, "Problem not supported in Java yet"

        # Write to Solution.java
        java_dir = tempfile.mkdtemp()
        java_file = os.path.join(java_dir, "Solution.java")
        with open(java_file, 'w') as f:
            f.write(runner)

        # Compile
        compile_proc = subprocess.run(
            f'javac "{java_file}"' if use_shell else ['javac', java_file],
            capture_output=True, text=True, timeout=15, shell=use_shell
        )

        if compile_proc.returncode != 0:
            return None, "Compilation Error: " + compile_proc.stderr.strip().split("\n")[0]

        # Run
        run_proc = subprocess.run(
            f'java -cp "{java_dir}" Solution' if use_shell else ['java', '-cp', java_dir, 'Solution'],
            capture_output=True, text=True, timeout=5, shell=use_shell
        )

        if run_proc.returncode != 0:
            return None, run_proc.stderr.strip().split("\n")[0] or "Runtime error"

        out = run_proc.stdout.strip()
        if not out:
            return None, "No output"

        try:
            import json
            return json.loads(out), None
        except:
            try: return int(out), None
            except:
                if out.lower() == "true": return True, None
                if out.lower() == "false": return False, None
                return out, None

    except subprocess.TimeoutExpired:
        return None, "Time Limit Exceeded"
    except FileNotFoundError:
        return None, "Java not found. Make sure Java is installed!"
    except Exception as e:
        return None, str(e)


# ── Google OAuth Login ──
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'No token provided'}, status=400)
    try:
        from urllib.request import urlopen
        import json as json_lib

        # Verify token with Google
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        response = urlopen(url)
        info = json_lib.loads(response.read())

        email    = info.get('email')
        name     = info.get('name', email.split('@')[0] if email else 'user')
        username = email.split('@')[0].replace('.','_') if email else 'user'

        if not email:
            return Response({'error': 'Could not get email from Google'}, status=400)

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': name.split()[0] if name else username,
            }
        )

        # If username taken, make unique
        if created is False and user.username != username:
            pass

        tokens = get_tokens(user)
        return Response({
            'message': 'Google login successful',
            'token':    tokens['access'],
            'username': user.username,
            'email':    user.email,
            'created':  created,
        })

    except Exception as e:
        return Response({'error': f'Google login failed: {str(e)}'}, status=400)


# ── AI Hint Generator ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_hint(request):
    problem_title       = request.data.get('problem_title', '')
    problem_description = request.data.get('problem_description', '')
    user_code           = request.data.get('user_code', '')
    hint_level          = int(request.data.get('hint_level', 0))
    language            = request.data.get('language', 'python')

    # Smart rule-based hint engine (no external API needed)
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

    # Get hints for this problem
    problem_hints = hints_db.get(problem_title, [
        "Break the problem into smaller parts. What is the simplest case?",
        "Think about what data structure would make lookups faster.",
        "Consider the time complexity. Can you do better than O(n²)?",
    ])

    # Analyse user code to give contextual hint
    code_empty    = not user_code.strip() or user_code.strip().endswith("pass") or user_code.strip().endswith("// Write your solution here")
    code_has_loop = "for" in user_code or "while" in user_code
    code_has_dict = "dict" in user_code or "{}" in user_code or "Map" in user_code or "map" in user_code
    code_short    = len(user_code.strip().split("")) <= 3

    # Pick hint based on code state and level
    if code_empty:
        hint_text = f"Your code is empty! Start by understanding the problem. {problem_hints[0]}"
    elif hint_level < len(problem_hints):
        hint_text = problem_hints[hint_level]
    else:
        hint_text = "You have seen all hints! Trust your understanding and try submitting your solution. You can do it! 💪"

    # Add language specific tip
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
    code = sanitize_code_input(request.data.get("code", "").strip())
    language   = request.data.get("language", "python")
    problem_id = int(request.data.get("problem_id", 1))
    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if len(code) > 5000:
        return Response({"error": "Code too long. Maximum 5000 characters allowed."}, status=status.HTTP_400_BAD_REQUEST)
    if language not in ["python", "c", "cpp", "java"]:
        return Response({"error": "Only Python, C, C++ and Java are supported"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS.get(problem_id, PROBLEM_TESTS[1])
    results = []

    for i, test in enumerate(tests):
        if language == "c":
            output, error = run_c_code(code, test["input"], test["type"])
        elif language == "cpp":
            output, error = run_cpp_code(code, test["input"], test["type"])
        elif language == "java":
            output, error = run_java_code(code, test["input"], test["type"])
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
    code = sanitize_code_input(request.data.get("code", "").strip())
    language   = request.data.get("language", "python")
    problem_id = int(request.data.get("problem_id", 1))

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
    if language not in ["python", "c", "cpp", "java"]:
        return Response({"error": "Only Python, C, C++ and Java are supported"}, status=status.HTTP_400_BAD_REQUEST)

    tests   = PROBLEM_TESTS.get(problem_id, PROBLEM_TESTS[1])
    passed  = 0
    total   = len(tests)
    results = []

    for i, test in enumerate(tests):
        if language == "c":
            output, error = run_c_code(code, test["input"], test["type"])
        elif language == "cpp":
            output, error = run_cpp_code(code, test["input"], test["type"])
        elif language == "java":
            output, error = run_java_code(code, test["input"], test["type"])
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
    user = request.user
    progress_obj, _ = Progress.objects.get_or_create(user=user)
    progress_obj.submissions += 1
    progress_obj.score += accuracy
    if accepted:
        if not SolvedProblem.objects.filter(user=user, problem_id=problem_id).exists():
            progress_obj.problems_solved += 1
            SolvedProblem.objects.create(user=user, problem_id=problem_id)
    progress_obj.save()

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
# ── Logout ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

# ── Companies ──
@api_view(['GET'])
@permission_classes([AllowAny])
def get_companies(request):
    from .company_data import COMPANY_QUESTIONS
    companies = []
    for key, val in COMPANY_QUESTIONS.items():
        companies.append({
            "id":             key,
            "name":           val["info"]["full_name"],
            "emoji":          val["info"]["logo_emoji"],
            "question_count": len(val["questions"]),
            "focus_topics":   val["info"]["focus_topics"],
            "difficulty_split": val["info"]["difficulty_split"],
            "rounds":         val["info"]["rounds"],
        })
    return Response({"companies": companies})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_company_questions(request, company_name):
    from .company_data import COMPANY_QUESTIONS
    company = COMPANY_QUESTIONS.get(company_name.lower())
    if not company:
        return Response({"error": "Company not found"}, status=404)
    difficulty = request.query_params.get('difficulty', '').strip()
    topic      = request.query_params.get('topic', '').strip()
    questions  = company["questions"]
    if difficulty:
        questions = [q for q in questions if q["difficulty"].lower() == difficulty.lower()]
    if topic:
        questions = [q for q in questions if q["topic"].lower() == topic.lower()]
    return Response({
        "company":   company["info"],
        "questions": questions,
        "total":     len(questions)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_roadmap(request):
    from .roadmap_data import DSA_ROADMAP
    topic = request.query_params.get('topic', '').lower().replace(" ", "_")
    if topic and topic in DSA_ROADMAP:
        return Response({"topic": topic, "data": DSA_ROADMAP[topic]})
    overview = {
        k: {
            "description":    v["description"],
            "estimated_time": v["estimated_time"],
            "prerequisites":  v["prerequisites"],
            "total_problems": len(v["easy"]) + len(v["medium"]) + len(v["hard"]),
            "easy_count":     len(v["easy"]),
            "medium_count":   len(v["medium"]),
            "hard_count":     len(v["hard"]),
        }
        for k, v in DSA_ROADMAP.items()
    }
    return Response({"topics": overview})
