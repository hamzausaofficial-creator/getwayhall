"""Fallback landing content when Django admin has no entries yet."""

from .gallery_seed import DEFAULT_GALLERY_URLS


def get_default_landing_payload(request=None):
    return {
        'hero_slides': [
            {
                'id': 0,
                'title': 'Manage Marriage Halls & Guest Houses With Ease',
                'subtitle': (
                    'Complete venue management solution for bookings, guests, '
                    'events, finances and operations.'
                ),
                'background_image_url': None,
                'button_text': 'Get Started',
                'button_link': '/login',
                'sort_order': 0,
            },
        ],
        'gallery': [
            {'id': 0, 'title': 'Grand Marriage Hall', 'category': 'MARRIAGE_HALL', 'category_label': 'Marriage Hall', 'image_url': DEFAULT_GALLERY_URLS['MARRIAGE_HALL'], 'sort_order': 0},
            {'id': 1, 'title': 'Royal Wedding Stage', 'category': 'WEDDING_STAGE', 'category_label': 'Wedding Stage', 'image_url': DEFAULT_GALLERY_URLS['WEDDING_STAGE'], 'sort_order': 1},
            {'id': 2, 'title': 'Deluxe Guest Room', 'category': 'GUEST_ROOM', 'category_label': 'Guest Room', 'image_url': DEFAULT_GALLERY_URLS['GUEST_ROOM'], 'sort_order': 2},
            {'id': 3, 'title': 'Fine Dining Area', 'category': 'DINING', 'category_label': 'Dining Area', 'image_url': DEFAULT_GALLERY_URLS['DINING'], 'sort_order': 3},
            {'id': 4, 'title': 'Elegant Reception', 'category': 'RECEPTION', 'category_label': 'Reception Area', 'image_url': DEFAULT_GALLERY_URLS['RECEPTION'], 'sort_order': 4},
            {'id': 5, 'title': 'Outdoor Event Lawn', 'category': 'OUTDOOR', 'category_label': 'Outdoor Event Area', 'image_url': DEFAULT_GALLERY_URLS['OUTDOOR'], 'sort_order': 5},
        ],
        'testimonials': [
            {
                'id': 0,
                'customer_name': 'Jahanzeb Mumtaz',
                'customer_photo_url': None,
                'designation': 'Owner, Morning Star Hall',
                'review': (
                    'Gateway Marriage Hall has completely transformed how we handle wedding season. '
                    'We have seen a 30% increase in revenue by automating follow-ups.'
                ),
                'rating': 5,
                'sort_order': 0,
            },
            {
                'id': 1,
                'customer_name': 'Fatima Sheikh',
                'customer_photo_url': None,
                'designation': 'Manager, Royal Guest House',
                'review': (
                    'Guest house check-ins, payments, and room availability - everything is in one place. '
                    'Our staff learned it in a single day.'
                ),
                'rating': 5,
                'sort_order': 1,
            },
            {
                'id': 2,
                'customer_name': 'Ahmed Raza',
                'customer_photo_url': None,
                'designation': 'Director, Al-Noor Event Complex',
                'review': (
                    'From hall bookings to expense vouchers, this system replaced five different notebooks. '
                    'Reports alone save us hours every week.'
                ),
                'rating': 5,
                'sort_order': 2,
            },
        ],
        'statistics': {
            'hero': [
                {'id': 1, 'section': 'hero', 'label': 'Total Events', 'value_display': '12k+', 'value_number': 12000, 'suffix': '+', 'sort_order': 0},
                {'id': 2, 'section': 'hero', 'label': 'Venues Managed', 'value_display': '200+', 'value_number': 200, 'suffix': '+', 'sort_order': 1},
                {'id': 3, 'section': 'hero', 'label': 'Guest House Stays', 'value_display': '8,000+', 'value_number': 8000, 'suffix': '+', 'sort_order': 2},
                {'id': 4, 'section': 'hero', 'label': 'Satisfaction Rate', 'value_display': '98%', 'value_number': 98, 'suffix': '%', 'sort_order': 3},
            ],
            'trust': [
                {'id': 5, 'section': 'trust', 'label': 'Years of Experience', 'value_display': '15+', 'value_number': 15, 'suffix': '+', 'sort_order': 0},
                {'id': 6, 'section': 'trust', 'label': 'Average Rating', 'value_display': '4.9', 'value_number': 49, 'suffix': '/5', 'sort_order': 1},
                {'id': 7, 'section': 'trust', 'label': 'Active Venues', 'value_display': '200+', 'value_number': 200, 'suffix': '+', 'sort_order': 2},
                {'id': 8, 'section': 'trust', 'label': 'Expert Support', 'value_display': '24/7', 'value_number': None, 'suffix': '', 'sort_order': 3},
            ],
        },
        'faqs': [
            {
                'id': 1,
                'question': 'Can I migrate my existing data?',
                'answer': 'Yes. Our team helps you import bookings, customer lists, and financial records from Excel or other platforms.',
                'sort_order': 0,
            },
            {
                'id': 2,
                'question': 'Does it support Marriage Hall and Guest House together?',
                'answer': 'Yes. One platform manages both marriage hall events and guest house stays with separate dashboards and unified reporting.',
                'sort_order': 1,
            },
            {
                'id': 3,
                'question': 'How secure is my customer data?',
                'answer': 'We use bank-grade encryption and role-based access so your team and customer data stay protected.',
                'sort_order': 2,
            },
            {
                'id': 4,
                'question': 'Is training required for staff?',
                'answer': 'No lengthy training needed. The interface is designed for venue staff and most teams are productive within a day.',
                'sort_order': 3,
            },
            {
                'id': 5,
                'question': 'Can I manage multiple halls from one account?',
                'answer': 'Yes. Add multiple halls, guest houses, and staff with role-based permissions from a single dashboard.',
                'sort_order': 4,
            },
            {
                'id': 6,
                'question': 'Do you offer customer support?',
                'answer': 'Yes. Our team provides onboarding help, data migration assistance, and ongoing support for your venue operations.',
                'sort_order': 5,
            },
        ],
    }
