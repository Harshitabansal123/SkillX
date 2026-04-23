from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home, dashboard, signup, login, logout, run_code, submit_code, upload_resume, get_hint, google_login, get_companies, get_company_questions, get_roadmap
from .admin_views import (
    admin_list_users,
    admin_user_detail,
    admin_delete_user,
    admin_set_manager_role,
    admin_all_progress,
    admin_reset_progress,
)

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────
    path("home/",                           home),
    path("signup/",                         signup),
    path("login/",                          login),
    path("auth/google/",                    google_login),
    path("token/refresh/",                  TokenRefreshView.as_view()),

    # ── Authenticated (any logged-in user) ───────────────────────────
    path("dashboard/",                      dashboard),
    path("code/run/",                       run_code),
    path("code/submit/",                    submit_code),
    path("code/hint/",                      get_hint),
    path("resume/upload/",                  upload_resume),
    path("logout/",                         logout),

    # ── Admin / Manager routes ───────────────────────────────────────
    # Admin only
    path("admin/users/",                    admin_list_users),
    path("admin/users/<int:user_id>/",      admin_user_detail),
    path("admin/users/<int:user_id>/delete/",   admin_delete_user),
    path("admin/users/<int:user_id>/role/", admin_set_manager_role),
    path("admin/progress/<int:user_id>/reset/", admin_reset_progress),

    # Manager or Admin
    path("admin/progress/",                 admin_all_progress),

    path('companies/',                    get_companies),
    path('companies/<str:company_name>/', get_company_questions),
    path('roadmap/',                      get_roadmap)]