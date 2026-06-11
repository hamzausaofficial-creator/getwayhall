from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0005_stay_billing_addons'),
    ]

    operations = [
        migrations.AddField(
            model_name='staybooking',
            name='cancellation_reason',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='staybooking',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
