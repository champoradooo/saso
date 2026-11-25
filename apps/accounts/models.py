from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_ADMIN = "admin"
    ROLE_STAFF = "staff"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Administrator"),
        (ROLE_STAFF, "Staff"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_ADMIN,
    )

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def can_manage_accounts(self):
        return self.role == self.ROLE_ADMIN

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
