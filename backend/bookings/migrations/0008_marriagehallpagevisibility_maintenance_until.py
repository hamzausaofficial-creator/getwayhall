from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0007_marriagehallpagevisibility_in_maintenance'),
    ]

    operations = [
        migrations.AddField(
            model_name='marriagehallpagevisibility',
            name='maintenance_until',
            field=models.DateTimeField(
                blank=True,
                help_text='Optional. Page reopens automatically after this date & time (Asia/Karachi).',
                null=True,
                verbose_name='Maintenance ends at',
            ),
        ),
    ]
