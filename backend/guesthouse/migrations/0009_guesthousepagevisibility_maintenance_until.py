from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0008_guesthousepagevisibility_in_maintenance'),
    ]

    operations = [
        migrations.AddField(
            model_name='guesthousepagevisibility',
            name='maintenance_until',
            field=models.DateTimeField(
                blank=True,
                help_text='Optional. Page reopens automatically after this date & time (Asia/Karachi).',
                null=True,
                verbose_name='Maintenance ends at',
            ),
        ),
    ]
