from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('bookings', '0005_booking_cancellation_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='MarriageHallPageVisibility',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('page_key', models.CharField(max_length=32)),
                ('label', models.CharField(max_length=64)),
                ('is_visible', models.BooleanField(
                    default=True,
                    help_text='Uncheck to put this page in maintenance mode (hidden from staff and managers).',
                )),
                ('sort_order', models.PositiveSmallIntegerField(default=0)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='hall_page_visibility',
                    to='core.tenant',
                )),
            ],
            options={
                'verbose_name': 'MH page maintenance',
                'verbose_name_plural': 'MH pages — maintenance mode',
                'ordering': ['sort_order', 'page_key'],
                'unique_together': {('tenant', 'page_key')},
            },
        ),
    ]
