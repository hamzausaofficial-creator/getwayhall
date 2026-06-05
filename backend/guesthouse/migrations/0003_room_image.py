from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0002_ghexpense_staypayment'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='gh_rooms/'),
        ),
    ]
