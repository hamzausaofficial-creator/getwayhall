from django.contrib import admin

from core.admin_widgets import format_maintenance_until_display


class MaintenanceUntilAdminMixin:
    """Shared admin behaviour for page maintenance scheduling."""

    class Media:
        css = {
            'all': ('admin/css/maintenance_schedule.css',),
        }

    @admin.display(description='Ends at (12h)')
    def ends_at_display(self, obj):
        return format_maintenance_until_display(obj.maintenance_until)

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'maintenance_until':
            from core.admin_widgets import MaintenanceUntilField
            kwargs['form_class'] = MaintenanceUntilField
        return super().formfield_for_dbfield(db_field, request, **kwargs)
