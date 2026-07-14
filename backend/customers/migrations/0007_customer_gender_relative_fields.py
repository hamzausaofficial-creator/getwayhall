from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0006_customer_list_status_audit_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[('', '—'), ('MALE', 'Male'), ('FEMALE', 'Female')],
                default='',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='relative_name',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='customer',
            name='relative_relation',
            field=models.CharField(
                blank=True,
                choices=[
                    ('', '—'),
                    ('FATHER', 'Father'),
                    ('HUSBAND', 'Husband'),
                    ('SON', 'Son'),
                    ('OTHER', 'Other'),
                ],
                default='',
                max_length=16,
            ),
        ),
    ]
