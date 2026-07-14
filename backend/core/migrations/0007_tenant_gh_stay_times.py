import datetime

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_notificationlog_options_alter_tenant_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='gh_default_check_in_time',
            field=models.TimeField(default=datetime.time(14, 0)),
        ),
        migrations.AddField(
            model_name='tenant',
            name='gh_default_check_out_time',
            field=models.TimeField(default=datetime.time(11, 0)),
        ),
    ]
