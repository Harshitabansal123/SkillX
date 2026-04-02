"""
sandbox_runner.py — Secure code execution sandbox for SkillX
============================================================
This script is invoked as a subprocess with strict OS-level restrictions:
  - Memory capped via resource limits (64 MB)
  - CPU time capped (3 seconds)
  - Dangerous builtins removed (__import__, open, exec, eval, etc.)
  - No network, no file I/O, no os/sys/subprocess access
  - stdin receives a JSON payload; stdout returns a JSON result

Usage (internal — called by views.py):
    python sandbox_runner.py < input.json
"""

import sys
import json
import signal
import traceback

# ── 1. Apply OS resource limits (Unix only) ──────────────────────────────────
try:
    import resource
    # Max CPU seconds
    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
    # Max memory: 64 MB
    resource.setrlimit(resource.RLIMIT_AS, (64 * 1024 * 1024, 64 * 1024 * 1024))
    # No new files
    resource.setrlimit(resource.RLIMIT_NOFILE, (0, 0))
except (ImportError, ValueError):
    # Windows or unsupported — skip resource limits
    # Time limit is still enforced by the parent subprocess timeout
    pass

# ── 2. Wall-clock timeout via SIGALRM (Unix only) ────────────────────────────
def _timeout_handler(signum, frame):
    raise TimeoutError("Time Limit Exceeded")

try:
    signal.signal(signal.SIGALRM, _timeout_handler)
    signal.alarm(3)
except AttributeError:
    pass  # Windows doesn't have SIGALRM

# ── 3. Scrub builtins — remove everything dangerous ──────────────────────────
SAFE_BUILTINS = {
    # Types
    "int", "float", "str", "bool", "bytes", "list", "tuple", "dict", "set",
    "frozenset", "complex", "bytearray", "memoryview", "type", "object",
    # Itertools / functional
    "len", "range", "enumerate", "zip", "map", "filter", "reversed",
    "sorted", "min", "max", "sum", "abs", "round", "divmod", "pow",
    "all", "any", "next", "iter", "slice",
    # String / repr
    "repr", "str", "chr", "ord", "hex", "oct", "bin", "format",
    "hash", "id",
    # Exceptions
    "Exception", "ValueError", "TypeError", "KeyError", "IndexError",
    "AttributeError", "StopIteration", "RuntimeError", "OverflowError",
    "ZeroDivisionError", "NotImplementedError", "RecursionError",
    "TimeoutError", "ArithmeticError", "LookupError",
    # Boolean
    "True", "False", "None",
    # Printing (safe — stdout is captured)
    "print",
}

import builtins
_original_builtins = vars(builtins).copy()

# Block __import__ entirely — no imports allowed in user code
def _blocked_import(*args, **kwargs):
    raise ImportError("Import statements are not allowed in submitted code.")

safe_builtins_dict = {k: _original_builtins[k] for k in SAFE_BUILTINS if k in _original_builtins}
safe_builtins_dict["__import__"] = _blocked_import
safe_builtins_dict["__build_class__"] = _original_builtins["__build_class__"]  # allow class defs

# ── 4. Read payload from stdin ────────────────────────────────────────────────
try:
    payload = json.loads(sys.stdin.read())
    code      = payload["code"]       # user's function definition(s)
    call_expr = payload["call"]       # expression to evaluate, e.g. "twoSum([2,7],9)"
    sort_output = payload.get("sort", False)
except Exception as e:
    print(json.dumps({"error": f"Bad sandbox input: {e}"}))
    sys.exit(1)

# ── 5. Execute user code in restricted namespace ──────────────────────────────
namespace = {"__builtins__": safe_builtins_dict}

try:
    exec(compile(code, "<user_code>", "exec"), namespace)
except SyntaxError as e:
    print(json.dumps({"error": f"SyntaxError: {e.msg} (line {e.lineno})"}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"error": f"{type(e).__name__}: {e}"}))
    sys.exit(0)

# ── 6. Call the function and capture result ───────────────────────────────────
try:
    result = eval(compile(call_expr, "<call>", "eval"), namespace)
    if sort_output and isinstance(result, list):
        result = sorted(result)
    print(json.dumps({"output": result}))
except TimeoutError:
    print(json.dumps({"error": "Time Limit Exceeded"}))
except RecursionError:
    print(json.dumps({"error": "RecursionError: Maximum recursion depth exceeded"}))
except MemoryError:
    print(json.dumps({"error": "Memory Limit Exceeded"}))
except Exception as e:
    print(json.dumps({"error": f"{type(e).__name__}: {e}"}))
