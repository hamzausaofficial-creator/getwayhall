import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_booking_decoration_package'),
        ('core', '0004_delete_notificationlog'),
        ('customers', '0003_customer_cnic_customer_full_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='sms_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='tenant',
            name='default_country_code',
            field=models.CharField(default='+92', max_length=5),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='sms_to_customers',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='whatsapp_to_customers',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='theme',
            field=models.CharField(default='light', max_length=10),
        ),
        migrations.AlterField(
            model_name='usersettings',
            name='notify_staff_activity',
            field=models.BooleanField(default=True),
        ),
        migrations.CreateModel(
            name='NotificationLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('SMS', 'SMS'), ('EMAIL', 'Email'), ('WHATSAPP', 'WhatsApp')], max_length=10)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('SENT', 'Sent'), ('FAILED', 'Failed'), ('SKIPPED', 'Skipped')], default='PENDING', max_length=10)),
                ('recipient', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('error_message', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('booking', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='bookings.booking')),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='customers.customer')),
                ('tenant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='core.tenant')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
