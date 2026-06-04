from django.apps import AppConfig


class GuesthouseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'guesthouse'

    def ready(self):
        import guesthouse.signals  # noqa: F401
