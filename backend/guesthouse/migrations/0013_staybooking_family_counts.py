from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0012_room_addon_services'),
    ]

    operations = [
        migrations.AddField(
            model_name='staybooking',
            name='adults_count',
            field=models.PositiveIntegerField(default=1, help_text='Guests aged 18 and above on this stay.'),
        ),
        migrations.AddField(
            model_name='staybooking',
            name='children_count',
            field=models.PositiveIntegerField(default=0, help_text='Guests under 18 on this stay.'),
        ),
    ]
