from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_marriagehall_page_visibility'),
    ]

    operations = [
        migrations.AddField(
            model_name='marriagehallpagevisibility',
            name='in_maintenance',
            field=models.BooleanField(
                default=False,
                help_text='When enabled, users who open this page see an “Under maintenance” screen.',
                verbose_name='Maintenance mode',
            ),
        ),
        migrations.AlterField(
            model_name='marriagehallpagevisibility',
            name='is_visible',
            field=models.BooleanField(
                default=True,
                help_text='Uncheck to hide this page from the sidebar and block direct access.',
                verbose_name='Show in menu',
            ),
        ),
        migrations.AlterModelOptions(
            name='marriagehallpagevisibility',
            options={
                'ordering': ['sort_order', 'page_key'],
                'verbose_name': 'MH page visibility',
                'verbose_name_plural': 'MH pages — show/hide & maintenance',
            },
        ),
    ]
