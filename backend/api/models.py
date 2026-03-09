from django.db import models
from django.contrib.auth.models import User
class Progress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    problems_solved = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    submissions = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.user.username} - Progress"