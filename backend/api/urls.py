from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home, dashboard, signup, login, logout, run_code, submit_code, upload_resume, get_hint, google_login
urlpatterns = [
    path("home/",           home),
    path("signup/",         signup),
    path("login/",          login),
    path("auth/google/",    google_login),
    path("dashboard/",      dashboard),
    path("code/run/",       run_code),
    path("code/submit/",    submit_code),
    path("code/hint/",      get_hint),
    path("resume/upload/",  upload_resume),
    path("logout/",         logout),
    path("token/refresh/",  TokenRefreshView.as_view()),
]