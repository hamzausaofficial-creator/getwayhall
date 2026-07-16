import datetime

from django.db import migrations, models


def forwards(apps, schema_editor):
    Tenant = apps.get_model('core', 'Tenant')
    Tenant.objects.filter(gh_default_check_in_time=datetime.time(14, 0)).update(
        gh_default_check_in_time=datetime.time(18, 0),
    )


def backwards(apps, schema_editor):
    Tenant = apps.get_model('core', 'Tenant')
    Tenant.objects.filter(gh_default_check_in_time=datetime.time(18, 0)).update(
        gh_default_check_in_time=datetime.time(14, 0),
    )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_tenant_gh_stay_times'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tenant',
            name='gh_default_check_in_time',
            field=models.TimeField(default=datetime.time(18, 0)),
        ),
        migrations.RunPython(forwards, backwards),
    ]
