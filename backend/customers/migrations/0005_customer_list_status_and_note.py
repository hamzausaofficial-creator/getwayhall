from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0004_customer_linked_primary_is_minor'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='list_status',
            field=models.CharField(
                choices=[('NORMAL', 'Normal'), ('WHITELISTED', 'Whitelisted'), ('BLOCKLISTED', 'Blocklisted')],
                default='NORMAL',
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='list_status_note',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
