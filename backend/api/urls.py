from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home, dashboard, signup, login, logout, run_code, submit_code, upload_resume, get_hint, profile_update

urlpatterns = [
    path("home/",           home),
    path("signup/",         signup),
    path("login/",          login),
    path("logout/",         logout),
    path("dashboard/",      dashboard),
    path("profile/update/", profile_update),
    path("code/run/",       run_code),
    path("code/submit/",    submit_code),
    path("code/hint/",      get_hint),
    path("resume/upload/",  upload_resume),
    path("token/refresh/",  TokenRefreshView.as_view()),
]
