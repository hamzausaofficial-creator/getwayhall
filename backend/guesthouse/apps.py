from django.apps import AppConfig


class GuesthouseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'guesthouse'
    verbose_name = 'Guest House'

    def ready(self):
        import guesthouse.signals  # noqa: F401
