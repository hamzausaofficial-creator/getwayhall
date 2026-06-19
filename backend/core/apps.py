from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = '01 — Platform & tenants'

    def ready(self):
        import core.notifications.signals  # noqa: F401
        from core.admin_branding import configure_admin_site
        configure_admin_site()
