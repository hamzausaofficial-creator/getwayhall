from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0007_stayguest'),
    ]

    operations = [
        migrations.AddField(
            model_name='guesthousepagevisibility',
            name='in_maintenance',
            field=models.BooleanField(
                default=False,
                help_text='When enabled, users who open this page see an “Under maintenance” screen.',
                verbose_name='Maintenance mode',
            ),
        ),
        migrations.AlterField(
            model_name='guesthousepagevisibility',
            name='is_visible',
            field=models.BooleanField(
                default=True,
                help_text='Uncheck to hide this page or module from the sidebar and block direct access.',
                verbose_name='Show in menu',
            ),
        ),
        migrations.AlterModelOptions(
            name='guesthousepagevisibility',
            options={
                'ordering': ['sort_order', 'page_key'],
                'verbose_name': 'GH page visibility',
                'verbose_name_plural': 'GH pages — show/hide & maintenance',
            },
        ),
    ]
