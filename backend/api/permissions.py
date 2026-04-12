"""
permissions.py — Role-based authorization for SkillX
=====================================================
Roles:
  - Admin   : Django staff/superuser — can manage all users, view all progress, delete data
  - Manager : Users in the "Manager" group — can view all users' progress (read-only)
  - Student : Regular authenticated user — can only access their own data

Usage on a view:
    @permission_classes([IsAdminUser])          # admin only
    @permission_classes([IsManagerOrAdmin])     # manager or admin
    @permission_classes([IsOwnerOrAdmin])       # must be the resource owner OR admin
    @permission_classes([IsAuthenticated])      # any logged-in user (existing behaviour)
"""

from rest_framework.permissions import BasePermission, IsAuthenticated
from django.contrib.auth.models import Group


# ── helpers ──────────────────────────────────────────────────────────────────

def is_admin(user):
    """True if the user is a Django staff or superuser."""
    return user and user.is_authenticated and (user.is_staff or user.is_superuser)


def is_manager(user):
    """True if the user belongs to the 'Manager' group."""
    return user and user.is_authenticated and user.groups.filter(name="Manager").exists()


# ── permission classes ────────────────────────────────────────────────────────

class IsAdminUser(BasePermission):
    """
    Only Django staff / superusers (i.e. platform admins) may access.
    Used for: user management, bulk data, admin dashboard.
    """
    message = "You must be an admin to perform this action."

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsManagerOrAdmin(BasePermission):
    """
    Managers (read-heavy HR/team leads) and admins.
    Used for: viewing all users' progress, exporting reports.
    """
    message = "You must be a manager or admin to perform this action."

    def has_permission(self, request, view):
        return is_admin(request.user) or is_manager(request.user)


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: the requesting user must own the object,
    OR be an admin.

    Views using this must call  check_object_permissions(request, obj)
    where obj has a  .user  attribute (e.g. Progress, SolvedProblem).
    """
    message = "You can only access your own data."

    def has_permission(self, request, view):
        # Still requires authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if is_admin(request.user):
            return True
        # Otherwise the object must belong to the requesting user
        owner = getattr(obj, "user", None)
        return owner == request.user


class IsSelfOrAdmin(BasePermission):
    """
    For user-profile endpoints: a user may only read/edit their own
    profile unless they are an admin.
    Expects the view to pass the target User object to check_object_permissions.
    """
    message = "You can only modify your own account."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if is_admin(request.user):
            return True
        # obj is a User instance here
        return obj == request.user
