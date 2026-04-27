from rest_framework.permissions import BasePermission

def is_admin(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)

class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated