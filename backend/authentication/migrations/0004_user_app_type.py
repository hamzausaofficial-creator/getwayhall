from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_user_profile_picture'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='app_type',
            field=models.CharField(
                choices=[('MARRIAGE_HALL', 'Marriage Hall'), ('GUEST_HOUSE', 'Guest House')],
                default='MARRIAGE_HALL',
                help_text='Which product this user can access after login.',
                max_length=20,
            ),
        ),
    ]
