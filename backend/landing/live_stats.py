"""Aggregate live platform metrics for the public landing page."""

from django.db.models import Avg, Min
from django.utils import timezone

from bookings.models import Booking
from customers.models import Customer
from guesthouse.models import StayBooking
from venues.models import Venue

from .models import Testimonial


def _compact_display(value, suffix='+'):
    """Format counts for marketing display (e.g. 12k+, 98%)."""
    n = int(value or 0)
    if suffix == '%':
        return f'{n}%', n, '%'
    if n >= 1000:
        k = n / 1000
        if k >= 10:
            text = f'{round(k)}k{suffix}'
        else:
            text = f'{k:.1f}k{suffix}'.replace('.0k', 'k')
        return text, n, ''
    return f'{n}{suffix}', n, suffix


def _rating_display(avg):
    if not avg:
        return '0.0', 0, '/5'
    val = round(float(avg), 1)
    return f'{val}', int(val * 10), '/5'


def _stat_row(key, section, label, raw_value, suffix, sort_order):
    if suffix == '/5':
        value_display, value_number, counter_suffix = _rating_display(raw_value)
    else:
        value_display, value_number, counter_suffix = _compact_display(raw_value, suffix)
    return {
        'id': key,
        'section': section,
        'label': label,
        'value_display': value_display,
        'value_number': value_number,
        'suffix': counter_suffix,
        'sort_order': sort_order,
        'live': True,
    }


def _platform_metrics():
    total_events = Booking.objects.exclude(booking_status='CANCELLED').count()
    venues_managed = Venue.objects.filter(status='ACTIVE').count()
    guest_house_stays = StayBooking.objects.exclude(status='CANCELLED').count()
    total_bookings = total_events + guest_house_stays
    happy_customers = Customer.objects.count()

    avg_rating = (
        Testimonial.objects.filter(is_active=True)
        .aggregate(avg=Avg('rating'))
        .get('avg')
    )
    satisfaction = round(float(avg_rating) / 5 * 100) if avg_rating else 0

    earliest = Booking.objects.aggregate(m=Min('created_at'))['m']
    if not earliest:
        earliest = Customer.objects.aggregate(m=Min('created_at'))['m']
    years_experience = max(1, timezone.now().year - earliest.year) if earliest else 1

    return {
        'total_events': total_events,
        'venues_managed': venues_managed,
        'guest_house_stays': guest_house_stays,
        'total_bookings': total_bookings,
        'happy_customers': happy_customers,
        'avg_rating': avg_rating,
        'satisfaction': satisfaction,
        'years_experience': years_experience,
    }


def get_live_hero_statistics():
    m = _platform_metrics()
    rows = [
        ('total_events', 'hero', 'Total Events', m['total_events'], '+'),
        ('venues_managed', 'hero', 'Venues Managed', m['venues_managed'], '+'),
        ('guest_house_stays', 'hero', 'Guest House Stays', m['guest_house_stays'], '+'),
        ('satisfaction_rate', 'hero', 'Satisfaction Rate', m['satisfaction'], '%'),
    ]
    return [_stat_row(key, section, label, val, suffix, i) for i, (key, section, label, val, suffix) in enumerate(rows)]


def get_live_trust_statistics():
    m = _platform_metrics()
    rows = [
        ('happy_customers', 'trust', 'Happy Customers', m['happy_customers'], '+'),
        ('years_experience', 'trust', 'Years of Experience', m['years_experience'], '+'),
        ('total_bookings', 'trust', 'Total Bookings', m['total_bookings'], '+'),
        ('average_rating', 'trust', 'Average Rating', m['avg_rating'], '/5'),
    ]
    return [_stat_row(key, section, label, val, suffix, i) for i, (key, section, label, val, suffix) in enumerate(rows)]


def get_live_why_badges():
    m = _platform_metrics()
    years_text, _, _ = _compact_display(m['years_experience'], '+')
    venues_text, _, _ = _compact_display(m['venues_managed'], '+')
    rating_text, _, _ = _rating_display(m['avg_rating'])

    return [
        {'id': 'years', 'text': f'{years_text} Years', 'live': True},
        {'id': 'venues', 'text': f'{venues_text} Venues', 'live': True},
        {'id': 'rating', 'text': f'{rating_text} Rating', 'live': True},
        {'id': 'support', 'text': '24/7 Support', 'live': False},
    ]


def get_live_statistics():
    return {
        'hero': get_live_hero_statistics(),
        'trust': get_live_trust_statistics(),
        'why_badges': get_live_why_badges(),
    }
