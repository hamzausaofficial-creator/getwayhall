from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0003_customer_cnic_customer_full_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='is_minor',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customer',
            name='linked_primary',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='linked_companions',
                to='customers.customer',
            ),
        ),
    ]
