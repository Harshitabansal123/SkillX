"""
admin_views.py — Admin & Manager restricted endpoints for SkillX
=================================================================
Endpoints added:
  GET  /api/admin/users/               — list all users (admin only)
  GET  /api/admin/users/<id>/          — get single user detail (admin only)
  DELETE /api/admin/users/<id>/        — delete a user (admin only)
  PATCH  /api/admin/users/<id>/role/   — promote/demote manager role (admin only)
  GET  /api/admin/progress/            — all users' progress (manager or admin)
  DELETE /api/admin/progress/<id>/reset/ — reset a user's progress (admin only)
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User, Group
from .models import Progress, SolvedProblem
from .permissions import IsAdminUser, IsManagerOrAdmin, IsSelfOrAdmin


# ── List all users ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_users(request):
    """
    GET /api/admin/users/
    Returns every registered user with their role flags.
    Only admins (staff/superuser) may call this.
    """
    users = User.objects.all().order_by('date_joined')
    data = []
    for u in users:
        data.append({
            "id":          u.id,
            "username":    u.username,
            "email":       u.email,
            "is_staff":    u.is_staff,
            "is_active":   u.is_active,
            "is_manager":  u.groups.filter(name="Manager").exists(),
            "date_joined": u.date_joined.isoformat(),
        })
    return Response({"users": data, "total": len(data)}, status=status.HTTP_200_OK)


# ── Single user detail ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, user_id):
    """
    GET /api/admin/users/<user_id>/
    Returns detailed info about a specific user.
    """
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        progress = u.progress
        progress_data = {
            "problems_solved": progress.problems_solved,
            "score":           progress.score,
            "submissions":     progress.submissions,
            "last_updated":    progress.last_updated.isoformat(),
        }
    except Progress.DoesNotExist:
        progress_data = None

    solved_ids = list(
        SolvedProblem.objects.filter(user=u).values_list('problem_id', flat=True)
    )

    return Response({
        "id":          u.id,
        "username":    u.username,
        "email":       u.email,
        "is_staff":    u.is_staff,
        "is_active":   u.is_active,
        "is_manager":  u.groups.filter(name="Manager").exists(),
        "date_joined": u.date_joined.isoformat(),
        "progress":    progress_data,
        "solved_problems": solved_ids,
    }, status=status.HTTP_200_OK)


# ── Delete a user ─────────────────────────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
    """
    DELETE /api/admin/users/<user_id>/
    Permanently deletes a user and all associated data.
    Admins cannot delete themselves via this endpoint.
    """
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if u == request.user:
        return Response(
            {"error": "You cannot delete your own account through this endpoint."},
            status=status.HTTP_400_BAD_REQUEST
        )

    username = u.username
    u.delete()
    return Response(
        {"message": f"User '{username}' has been deleted."},
        status=status.HTTP_200_OK
    )


# ── Promote / demote manager role ─────────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_set_manager_role(request, user_id):
    """
    PATCH /api/admin/users/<user_id>/role/
    Body: { "is_manager": true | false }
    Grants or revokes the 'Manager' group membership.
    """
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    make_manager = request.data.get("is_manager")
    if make_manager is None:
        return Response(
            {"error": "Provide 'is_manager': true or false"},
            status=status.HTTP_400_BAD_REQUEST
        )

    manager_group, _ = Group.objects.get_or_create(name="Manager")

    if make_manager:
        u.groups.add(manager_group)
        msg = f"'{u.username}' is now a Manager."
    else:
        u.groups.remove(manager_group)
        msg = f"'{u.username}' is no longer a Manager."

    return Response({"message": msg, "username": u.username, "is_manager": make_manager})


# ── View all users' progress ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsManagerOrAdmin])
def admin_all_progress(request):
    """
    GET /api/admin/progress/
    Returns a summary of every user's progress.
    Accessible by managers AND admins.
    """
    progress_list = Progress.objects.select_related('user').all()
    data = []
    for p in progress_list:
        data.append({
            "user_id":         p.user.id,
            "username":        p.user.username,
            "email":           p.user.email,
            "problems_solved": p.problems_solved,
            "score":           p.score,
            "submissions":     p.submissions,
            "accuracy":        int(p.score / p.submissions) if p.submissions > 0 else 0,
            "last_updated":    p.last_updated.isoformat(),
        })
    return Response({"progress": data, "total": len(data)}, status=status.HTTP_200_OK)


# ── Reset a user's progress ───────────────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_reset_progress(request, user_id):
    """
    DELETE /api/admin/progress/<user_id>/reset/
    Resets a user's score, submissions, and solved problems to zero.
    Admin only.
    """
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    Progress.objects.filter(user=u).update(
        problems_solved=0, score=0, submissions=0
    )
    SolvedProblem.objects.filter(user=u).delete()

    return Response(
        {"message": f"Progress reset for user '{u.username}'."},
        status=status.HTTP_200_OK
    )
