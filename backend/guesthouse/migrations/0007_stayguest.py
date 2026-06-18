from django.db import migrations, models
import django.db.models.deletion


def backfill_stay_guests(apps, schema_editor):
    StayBooking = apps.get_model('guesthouse', 'StayBooking')
    StayGuest = apps.get_model('guesthouse', 'StayGuest')
    for stay in StayBooking.objects.select_related('customer').iterator():
        if StayGuest.objects.filter(stay_id=stay.id).exists():
            continue
        customer = stay.customer
        if not customer:
            continue
        StayGuest.objects.create(
            stay_id=stay.id,
            customer_id=customer.id,
            full_name=customer.full_name or customer.first_name or 'Guest',
            cnic=customer.cnic or '',
            phone=customer.phone or '',
            is_primary=True,
            sort_order=0,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0001_initial'),
        ('guesthouse', '0006_stay_cancellation_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='StayGuest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=200)),
                ('cnic', models.CharField(blank=True, default='', max_length=20)),
                ('phone', models.CharField(blank=True, default='', max_length=20)),
                ('is_primary', models.BooleanField(default=False)),
                ('sort_order', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stay_guest_entries', to='customers.customer')),
                ('stay', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guest_roster', to='guesthouse.staybooking')),
            ],
            options={
                'ordering': ['sort_order', 'id'],
            },
        ),
        migrations.RunPython(backfill_stay_guests, migrations.RunPython.noop),
    ]
