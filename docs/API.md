# SkillX API Documentation

Base URL: `http://localhost:8000/api`

Authentication: Bearer token (JWT) — include in header:
`Authorization: Bearer <your_access_token>`

---

## Public Endpoints (no auth required)

### GET /home/
Health check.
**Response:** `{"message": "SkillX Backend Running ✦"}`

### POST /signup/
Create a new account.
**Body:** `{"username": "string", "email": "string", "password": "string (min 8 chars)"}`
**Response:** `{"token": "...", "refresh": "...", "username": "...", "email": "..."}`

### POST /login/
Login with existing account.
**Body:** `{"username": "string", "password": "string"}`
**Response:** `{"token": "...", "refresh": "...", "username": "...", "email": "..."}`

### POST /auth/google/
Login with Google OAuth.
**Body:** `{"token": "google_id_token"}`
**Response:** `{"token": "...", "username": "...", "email": "..."}`

### POST /token/refresh/
Get a new access token using refresh token.
**Body:** `{"refresh": "string"}`
**Response:** `{"access": "new_access_token"}`

---

## Protected Endpoints (auth required)

### POST /logout/
Logout and blacklist the refresh token.
**Body:** `{"refresh": "string"}`
**Response:** `{"message": "Logged out successfully"}`

### GET /dashboard/
Get current user's progress and stats.
**Response:**
```json
{
  "username": "string",
  "email": "string",
  "problems_solved": 0,
  "submissions": 0,
  "accuracy": 0,
  "streak": 0,
  "level": 1,
  "weak_topics": []
}
```

### POST /code/run/
Run code against test cases without saving.
**Body:**
```json
{
  "code": "string",
  "language": "python | c | cpp | java",
  "problem_id": 1
}
```
**Response:**
```json
{
  "success": true,
  "results": [{"case": 1, "passed": true, "output": "...", "expected": "..."}],
  "runtime": "~50ms",
  "memory": "14.2 MB"
}
```

### POST /code/submit/
Submit code — saves progress to database on success.
**Body:** same as /code/run/
**Response:**
```json
{
  "status": "Accepted | Wrong Answer",
  "score": 100,
  "passed": 3,
  "total": 3,
  "feedback": "string"
}
```

### POST /code/hint/
Get an AI-generated hint for a problem.
**Body:**
```json
{
  "problem_title": "string",
  "problem_description": "string",
  "user_code": "string",
  "hint_level": 0,
  "language": "python"
}
```
**Response:** `{"hint": "string", "hint_level": 1}`

### POST /resume/upload/
Upload a PDF resume to get skill analysis and interview questions.
**Body:** multipart/form-data with `resume` field (PDF file)
**Response:**
```json
{
  "skills": {"Languages": ["Python"], "Frameworks": ["React"]},
  "questions": [{"question": "string", "skill": "string", "difficulty": "Easy"}],
  "word_count": 450
}
```

---

## Problems Available (IDs 1–13)

| ID | Title | Difficulty |
|----|-------|------------|
| 1  | Two Sum | Easy |
| 2  | Reverse a String | Easy |
| 3  | FizzBuzz | Easy |
| 4  | Palindrome Number | Easy |
| 5  | Maximum Subarray | Medium |
| 6  | Valid Parentheses | Medium |
| 7  | Climbing Stairs | Medium |
| 8  | Best Time to Buy Stock | Medium |
| 9  | Missing Number | Easy |
| 10 | Count Vowels | Easy |
| 11 | Factorial | Easy |
| 12 | Find Maximum | Easy |
| 13 | Second Largest | Medium |

---

## Languages Supported
- Python
- C
- C++
- Java

## Security
- JWT authentication with 15-minute access token lifetime
- Refresh tokens valid for 1 day with automatic rotation
- Rate limiting: 20 requests/hour (anonymous), 100 requests/hour (authenticated)
- CORS enabled for localhost:5173