from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0013_staybooking_family_counts'),
        ('customers', '0004_customer_linked_primary_is_minor'),
    ]

    operations = [
        migrations.AddField(
            model_name='stayguest',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='stayguest',
            name='is_minor',
            field=models.BooleanField(default=False),
        ),
    ]
