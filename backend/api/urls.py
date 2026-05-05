from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home, dashboard, signup, login, logout, run_code, submit_code, get_companies, get_company_questions
from .admin_views import (
    admin_list_users,
    admin_user_detail,
    admin_delete_user,
    admin_set_manager_role,
    admin_all_progress,
    admin_reset_progress,
)

urlpatterns = [
    # Public
    path("home/", home),
    path("signup/", signup),
    path("login/", login),
    path("token/refresh/", TokenRefreshView.as_view()),

    # User
    path("dashboard/", dashboard),
    path("code/run/", run_code),
    path("code/submit/", submit_code),
    path("logout/", logout),

    # Admin
    path("admin/users/", admin_list_users),
    path("admin/users/<int:user_id>/", admin_user_detail),
    path("admin/users/<int:user_id>/delete/", admin_delete_user),
    path("admin/users/<int:user_id>/role/", admin_set_manager_role),
    path("admin/progress/<int:user_id>/reset/", admin_reset_progress),
    path("admin/progress/", admin_all_progress),

    # Companies
    path("companies/", get_companies),
    path("companies/<str:company_name>/", get_company_questions),
]
