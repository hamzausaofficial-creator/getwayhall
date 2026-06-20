from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0011_hide_id_scanner_module_by_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='addon_services',
            field=models.ManyToManyField(
                blank=True,
                help_text='Extra services guests can add when booking this room.',
                related_name='rooms',
                to='guesthouse.guesthouseservice',
            ),
        ),
    ]
