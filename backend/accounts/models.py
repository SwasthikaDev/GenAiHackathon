from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    display_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.username

# Create your models here.
