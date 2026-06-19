from django import forms

from guesthouse.models import GuestHousePageMaintenance
from bookings.models import MarriageHallPageMaintenance
from core.admin_widgets import MaintenanceUntilField


class GuestHousePageMaintenanceForm(forms.ModelForm):
    maintenance_until = MaintenanceUntilField(
        label='Maintenance ends at',
        help_text='Pick date, then hour, minute, and AM/PM (12-hour clock).',
    )

    class Meta:
        model = GuestHousePageMaintenance
        fields = '__all__'


class MarriageHallPageMaintenanceForm(forms.ModelForm):
    maintenance_until = MaintenanceUntilField(
        label='Maintenance ends at',
        help_text='Pick date, then hour, minute, and AM/PM (12-hour clock).',
    )

    class Meta:
        model = MarriageHallPageMaintenance
        fields = '__all__'
