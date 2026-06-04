# Generated manually for username-based login

from django.db import migrations, models


def populate_usernames(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    used = set()
    for user in User.objects.all().order_by('id'):
        if user.username:
            used.add(user.username)
            continue
        base = (user.email or 'user').split('@')[0].strip() or 'user'
        base = ''.join(c for c in base if c.isalnum() or c in '._-')[:150] or 'user'
        candidate = base
        n = 1
        while candidate in used:
            candidate = f'{base}{n}'
            n += 1
        user.username = candidate
        user.save(update_fields=['username'])
        used.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=150, null=True, unique=False),
        ),
        migrations.RunPython(populate_usernames, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(
                max_length=150,
                unique=True,
                verbose_name='username',
                help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
                error_messages={'unique': 'A user with that username already exists.'},
            ),
        ),
    ]
