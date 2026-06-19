"""12-hour AM/PM date & time widgets for maintenance scheduling in Django admin."""

from datetime import datetime, time

from django import forms
from django.contrib.admin.widgets import AdminDateWidget
from django.utils import timezone


class TwelveHourTimeSelectWidget(forms.MultiWidget):
    """Hour (1–12), minute, and AM/PM dropdowns."""

    def __init__(self, attrs=None):
        hour_choices = [(i, str(i)) for i in range(1, 13)]
        minute_choices = [(f'{m:02d}', f'{m:02d}') for m in range(60)]
        widgets = (
            forms.Select(choices=hour_choices, attrs={'class': 'maintenance-time-hour'}),
            forms.Select(choices=minute_choices, attrs={'class': 'maintenance-time-minute'}),
            forms.Select(
                choices=(('AM', 'AM'), ('PM', 'PM')),
                attrs={'class': 'maintenance-time-ampm'},
            ),
        )
        super().__init__(widgets, attrs)

    def decompress(self, value):
        if isinstance(value, time):
            hour24 = value.hour
            minute = value.minute
        elif isinstance(value, datetime):
            hour24 = value.hour
            minute = value.minute
        else:
            return [12, '00', 'AM']

        ampm = 'AM' if hour24 < 12 else 'PM'
        hour12 = hour24 % 12 or 12
        return [hour12, f'{minute:02d}', ampm]

    def value_from_datadict(self, data, files, name):
        try:
            hour12 = int(data.get(f'{name}_0', 12))
            minute = int(data.get(f'{name}_1', '00'))
            ampm = data.get(f'{name}_2', 'AM')
        except (TypeError, ValueError):
            return None

        if ampm == 'PM' and hour12 != 12:
            hour24 = hour12 + 12
        elif ampm == 'AM' and hour12 == 12:
            hour24 = 0
        else:
            hour24 = hour12

        return time(hour24, minute)

    def format_output(self, rendered_widgets):
        return (
            '<span class="maintenance-time-select">'
            f'{rendered_widgets[0]}<span class="maintenance-time-colon">:</span>'
            f'{rendered_widgets[1]} {rendered_widgets[2]}'
            '</span>'
        )


class MaintenanceUntilWidget(forms.MultiWidget):
    """Admin date picker + 12-hour time dropdowns."""

    def __init__(self, attrs=None):
        widgets = (
            AdminDateWidget(attrs={'class': 'maintenance-date-input'}),
            TwelveHourTimeSelectWidget(),
        )
        super().__init__(widgets, attrs)

    def decompress(self, value):
        if value:
            local = timezone.localtime(value) if timezone.is_aware(value) else value
            return [local.date(), local.time()]
        return [None, None]

    def value_from_datadict(self, data, files, name):
        date_value = self.widgets[0].value_from_datadict(data, files, f'{name}_0')
        time_value = self.widgets[1].value_from_datadict(data, files, f'{name}_1')
        if date_value and time_value:
            return [date_value, time_value]
        return None

    def format_output(self, rendered_widgets):
        return (
            '<div class="maintenance-until-widget">'
            f'<div class="maintenance-until-widget__date">{rendered_widgets[0]}</div>'
            f'<div class="maintenance-until-widget__time">{rendered_widgets[1]}</div>'
            '</div>'
        )


class MaintenanceUntilField(forms.SplitDateTimeField):
    """DateTime field that uses 12-hour AM/PM dropdowns in admin."""

    widget = MaintenanceUntilWidget

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('required', False)
        super().__init__(*args, **kwargs)

    def compress(self, data_list):
        if data_list:
            date_value, time_value = data_list
            if date_value and time_value:
                combined = datetime.combine(date_value, time_value)
                if timezone.is_aware(combined):
                    return combined
                return timezone.make_aware(combined, timezone.get_current_timezone())
        return None


def format_maintenance_until_display(value):
    if not value:
        return '—'
    local = timezone.localtime(value) if timezone.is_aware(value) else value
    return local.strftime('%d %b %Y, %I:%M %p')
