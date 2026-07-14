import datetime
import random

from django.db import migrations, models
from django.db.models import Q


def backfill_receipt_refs(apps, schema_editor):
    StayPayment = apps.get_model('guesthouse', 'StayPayment')
    used = set(
        StayPayment.objects.exclude(receipt_ref__isnull=True)
        .exclude(receipt_ref='')
        .values_list('receipt_ref', flat=True),
    )
    for payment in StayPayment.objects.filter(Q(receipt_ref__isnull=True) | Q(receipt_ref='')):
        date_part = (
            payment.payment_date.date().strftime('%y%m%d')
            if payment.payment_date
            else datetime.date.today().strftime('%y%m%d')
        )
        for _ in range(20):
            candidate = f'GHR{date_part}{random.randint(1000, 9999)}'
            if candidate not in used:
                payment.receipt_ref = candidate
                payment.save(update_fields=['receipt_ref'])
                used.add(candidate)
                break


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0014_stayguest_minor_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='staypayment',
            name='receipt_ref',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.RunPython(backfill_receipt_refs, migrations.RunPython.noop),
    ]
