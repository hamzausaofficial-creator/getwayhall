from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from core.models import Tenant

class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
    )
    APP_TYPE_CHOICES = (
        ('MARRIAGE_HALL', 'Marriage Hall'),
        ('GUEST_HOUSE', 'Guest House'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    app_type = models.CharField(
        max_length=20,
        choices=APP_TYPE_CHOICES,
        default='MARRIAGE_HALL',
        help_text='Which product this user can access after login.',
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    profile_picture = models.ImageField(upload_to='avatars/', blank=True, null=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.username

class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='staff')
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    phone = models.CharField(max_length=20, blank=True, null=True)
    joining_date = models.DateField(auto_now_add=True)
    status = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.user.role}"
