from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url  = '/api/signup/'
        self.login_url   = '/api/login/'
        self.logout_url  = '/api/logout/'
        self.dash_url    = '/api/dashboard/'
        self.run_url     = '/api/code/run/'
        self.submit_url  = '/api/code/submit/'

    # ── Signup ──
    def test_signup_success(self):
        res = self.client.post(self.signup_url, {
            "username": "testuser",
            "email": "test@example.com",
<<<<<<< HEAD
            "password": "securepass123"
=======
            "password": "Securepass1"
>>>>>>> master
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", res.data)

    def test_signup_duplicate_username(self):
<<<<<<< HEAD
        User.objects.create_user("dup", "dup@x.com", "pass1234")
=======
        User.objects.create_user("dup", "dup@x.com", "Pass1234")
>>>>>>> master
        res = self.client.post(self.signup_url, {
            "username": "dup", "email": "other@x.com", "password": "pass1234"
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_short_password(self):
        res = self.client.post(self.signup_url, {
            "username": "shortpass", "email": "s@x.com", "password": "123"
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Login ──
    def test_login_success(self):
<<<<<<< HEAD
        User.objects.create_user("loginuser", "l@x.com", "mypassword")
        res = self.client.post(self.login_url, {
            "username": "loginuser", "password": "mypassword"
=======
        User.objects.create_user("loginuser", "l@x.com", "Mypassword1")
        res = self.client.post(self.login_url, {
            "username": "loginuser", "password": "Mypassword1"
>>>>>>> master
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)
        self.assertIn("refresh", res.data)

    def test_login_wrong_password(self):
<<<<<<< HEAD
        User.objects.create_user("badpass", "b@x.com", "correct")
=======
        User.objects.create_user("badpass", "b@x.com", "Correct1")
>>>>>>> master
        res = self.client.post(self.login_url, {
            "username": "badpass", "password": "wrong"
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Dashboard (auth required) ──
    def test_dashboard_requires_auth(self):
        res = self.client.get(self.dash_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_with_auth(self):
        signup_res = self.client.post(self.signup_url, {
<<<<<<< HEAD
            "username": "dashuser", "email": "d@x.com", "password": "dashpass1"
=======
            "username": "dashuser", "email": "d@x.com", "password": "Dashpass1"
>>>>>>> master
        })
        token = signup_res.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get(self.dash_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("problems_solved", res.data)

    # ── Run Code ──
    def test_run_code_python(self):
        signup_res = self.client.post(self.signup_url, {
<<<<<<< HEAD
            "username": "coderunner", "email": "cr@x.com", "password": "codepass1"
=======
            "username": "coderunner", "email": "cr@x.com", "password": "Codepass1"
>>>>>>> master
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {signup_res.data['token']}")
        res = self.client.post(self.run_url, {
            "code": "def twoSum(nums, target):\n    seen={}\n    for i,n in enumerate(nums):\n        if target-n in seen: return [seen[target-n],i]\n        seen[n]=i",
            "language": "python",
            "problem_id": 1
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])

    def test_run_code_too_long(self):
        signup_res = self.client.post(self.signup_url, {
<<<<<<< HEAD
            "username": "longcoder", "email": "lc@x.com", "password": "longpass1"
=======
            "username": "longcoder", "email": "lc@x.com", "password": "Longpass1"
>>>>>>> master
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {signup_res.data['token']}")
        res = self.client.post(self.run_url, {
            "code": "x" * 6000,
            "language": "python",
            "problem_id": 1
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Submit Code ──
    def test_submit_code_updates_progress(self):
        signup_res = self.client.post(self.signup_url, {
<<<<<<< HEAD
            "username": "submitter", "email": "sub@x.com", "password": "submitpass"
=======
            "username": "submitter", "email": "sub@x.com", "password": "Submitpass1"
>>>>>>> master
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {signup_res.data['token']}")
        self.client.post(self.submit_url, {
            "code": "def twoSum(nums, target):\n    seen={}\n    for i,n in enumerate(nums):\n        if target-n in seen: return [seen[target-n],i]\n        seen[n]=i",
            "language": "python",
            "problem_id": 1
        })
        dash_res = self.client.get(self.dash_url)
        self.assertEqual(dash_res.data["problems_solved"], 1)

    # ── Logout ──
    def test_logout_blacklists_token(self):
        signup_res = self.client.post(self.signup_url, {
<<<<<<< HEAD
            "username": "logoutuser", "email": "lo@x.com", "password": "logoutpass"
=======
            "username": "logoutuser", "email": "lo@x.com", "password": "Logoutpass1"
>>>>>>> master
        })
        token   = signup_res.data["token"]
        refresh = signup_res.data["refresh"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.post(self.logout_url, {"refresh": refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
