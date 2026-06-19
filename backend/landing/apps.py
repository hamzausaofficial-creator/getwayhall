from django.apps import AppConfig


class LandingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'landing'
    verbose_name = '10 — Public website (landing page)'

    def ready(self):
        from . import signals  # noqa: F401
