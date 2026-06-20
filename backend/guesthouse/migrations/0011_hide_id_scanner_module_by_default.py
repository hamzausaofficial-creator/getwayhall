from django.db import migrations


def hide_id_scanner(apps, schema_editor):
    GuestHousePageVisibility = apps.get_model('guesthouse', 'GuestHousePageVisibility')
    GuestHousePageVisibility.objects.filter(page_key='id_scanner').update(is_visible=False)


class Migration(migrations.Migration):

    dependencies = [
        ('guesthouse', '0010_guesthousepagelive_guesthousepagemaintenance_and_more'),
    ]

    operations = [
        migrations.RunPython(hide_id_scanner, migrations.RunPython.noop),
    ]
