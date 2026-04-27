from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Progress, SolvedProblem
from .permissions import IsOwnerOrAdmin, is_admin

@api_view(['GET'])
@permission_classes([IsOwnerOrAdmin])
def admin_list_users(request):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.all().values('id', 'username', 'email', 'is_staff', 'date_joined')
    return Response({"users": list(users)})

@api_view(['GET'])
@permission_classes([IsOwnerOrAdmin])
def admin_user_detail(request, username):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    progress, _ = Progress.objects.get_or_create(user=user)
    solved = list(SolvedProblem.objects.filter(user=user).values('problem_id', 'solved_at'))
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
        "date_joined": user.date_joined,
        "progress": {
            "problems_solved": progress.problems_solved,
            "score": progress.score,
            "submissions": progress.submissions,
        },
        "solved_problems": solved,
    })

@api_view(['DELETE'])
@permission_classes([IsOwnerOrAdmin])
def admin_delete_user(request, username):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    user.delete()
    return Response({"message": f"User '{username}' deleted."})

@api_view(['POST'])
@permission_classes([IsOwnerOrAdmin])
def admin_set_manager_role(request, username):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    user.is_staff = request.data.get("is_staff", True)
    user.save()
    return Response({"message": f"User '{username}' staff status set to {user.is_staff}."})

@api_view(['GET'])
@permission_classes([IsOwnerOrAdmin])
def admin_all_progress(request):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    data = []
    for p in Progress.objects.select_related('user').all():
        data.append({
            "username": p.user.username,
            "problems_solved": p.problems_solved,
            "score": p.score,
            "submissions": p.submissions,
            "last_updated": p.last_updated,
        })
    return Response({"progress": data})

@api_view(['POST'])
@permission_classes([IsOwnerOrAdmin])
def admin_reset_progress(request, username):
    if not is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    Progress.objects.filter(user=user).update(problems_solved=0, score=0, submissions=0)
    SolvedProblem.objects.filter(user=user).delete()
    return Response({"message": f"Progress reset for '{username}'."})