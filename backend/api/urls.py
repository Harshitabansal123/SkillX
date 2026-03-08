from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home, dashboard, signup, login, run_code, submit_code, upload_resume

urlpatterns = [
    path("home/",           home),
    path("signup/",         signup),
    path("login/",          login),
    path("dashboard/",      dashboard),
    path("code/run/",       run_code),
    path("code/submit/",    submit_code),
    path("resume/upload/",  upload_resume),
    path("token/refresh/",  TokenRefreshView.as_view()),
]