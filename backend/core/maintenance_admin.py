from django import forms
from django.contrib import admin
from django.utils.safestring import mark_safe

from core.admin_widgets import MaintenanceUntilField, format_maintenance_until_display


class MaintenanceUntilAdminMixin:
    """Shared admin behaviour for page maintenance scheduling."""

    class Media:
        css = {
            'all': ('admin/css/maintenance_schedule.css',),
        }

    @admin.display(description='Saved end time')
    def ends_at_display(self, obj):
        text = format_maintenance_until_display(obj.maintenance_until)
        if text == '—':
            return text
        return mark_safe(f'<span class="maintenance-saved-time">{text}</span>')

    def get_changelist_form(self, request, **kwargs):
        admin_model = self.model

        class ChangelistMaintenanceForm(forms.ModelForm):
            maintenance_until = MaintenanceUntilField(
                label='Maintenance ends at',
                required=False,
            )

            class Meta:
                model = admin_model
                fields = ['in_maintenance', 'maintenance_until']

        return ChangelistMaintenanceForm

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'maintenance_until':
            kwargs['form_class'] = MaintenanceUntilField
        return super().formfield_for_dbfield(db_field, request, **kwargs)
