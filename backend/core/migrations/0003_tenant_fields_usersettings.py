from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_notificationlog'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='tenant',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notify_new_bookings', models.BooleanField(default=True)),
                ('notify_payments', models.BooleanField(default=True)),
                ('notify_weekly_reports', models.BooleanField(default=True)),
                ('notify_staff_activity', models.BooleanField(default=False)),
                ('timezone', models.CharField(default='Asia/Karachi', max_length=64)),
                ('language', models.CharField(default='en', max_length=10)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
