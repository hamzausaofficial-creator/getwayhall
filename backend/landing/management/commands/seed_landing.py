from django.core.management.base import BaseCommand

from landing.models import HeroSlide, GalleryImage, Testimonial, LandingStatistic, LandingFAQ


class Command(BaseCommand):
    help = 'Seed default landing page CMS content for Django admin'

    def handle(self, *args, **options):
        if HeroSlide.objects.exists():
            self.stdout.write(self.style.WARNING('Landing content already exists - skipping seed.'))
            return

        HeroSlide.objects.create(
            title='Manage Marriage Halls & Guest Houses With Ease',
            subtitle='Complete venue management solution for bookings, guests, events, finances and operations.',
            button_text='Get Started',
            button_link='/login',
            sort_order=0,
        )

        for i, (title, cat) in enumerate([
            ('Grand Marriage Hall', 'MARRIAGE_HALL'),
            ('Royal Wedding Stage', 'WEDDING_STAGE'),
            ('Deluxe Guest Room', 'GUEST_ROOM'),
            ('Fine Dining Area', 'DINING'),
            ('Elegant Reception', 'RECEPTION'),
            ('Outdoor Event Lawn', 'OUTDOOR'),
        ]):
            GalleryImage.objects.create(title=title, category=cat, sort_order=i)

        testimonials = [
            ('Jahanzeb Mumtaz', 'Owner, Morning Star Hall',
             'Gateway Marriage Hall has completely transformed how we handle wedding season. We have seen a 30% increase in revenue by automating follow-ups.'),
            ('Fatima Sheikh', 'Manager, Royal Guest House',
             'Guest house check-ins, payments, and room availability - everything is in one place. Our staff learned it in a single day.'),
            ('Ahmed Raza', 'Director, Al-Noor Event Complex',
             'From hall bookings to expense vouchers, this system replaced five different notebooks. Reports alone save us hours every week.'),
        ]
        for i, (name, designation, review) in enumerate(testimonials):
            Testimonial.objects.create(
                customer_name=name,
                designation=designation,
                review=review,
                rating=5,
                sort_order=i,
            )

        stats = [
            ('hero', 'Total Events', '12k+', 12000, '+', 0),
            ('hero', 'Venues Managed', '200+', 200, '+', 1),
            ('hero', 'Guest House Stays', '8,000+', 8000, '+', 2),
            ('hero', 'Satisfaction Rate', '98%', 98, '%', 3),
            ('trust', 'Years of Experience', '15+', 15, '+', 0),
            ('trust', 'Average Rating', '4.9', 49, '/5', 1),
            ('trust', 'Active Venues', '200+', 200, '+', 2),
            ('trust', 'Expert Support', '24/7', None, '', 3),
        ]
        for section, label, display, num, suffix, order in stats:
            LandingStatistic.objects.create(
                section=section,
                label=label,
                value_display=display,
                value_number=num,
                suffix=suffix,
                sort_order=order,
            )

        faqs = [
            ('Can I migrate my existing data?', 'Yes. Import bookings, customers, and financial records from Excel with our onboarding support.'),
            ('Does it support Marriage Hall and Guest House?', 'Yes. Manage both venue types from one platform with dedicated modules.'),
            ('How secure is my customer data?', 'Role-based access, encrypted storage, and audit trails keep your data safe.'),
            ('Is training required for staff?', 'No lengthy training needed. The interface is designed for venue staff and most teams are productive within a day.'),
            ('Can I manage multiple halls from one account?', 'Yes. Add multiple halls, guest houses, and staff with role-based permissions from a single dashboard.'),
            ('Do you offer customer support?', 'Yes. Our team provides onboarding help, data migration assistance, and ongoing support.'),
        ]
        for i, (q, a) in enumerate(faqs):
            LandingFAQ.objects.create(question=q, answer=a, sort_order=i)

        self.stdout.write(self.style.SUCCESS('Landing page content seeded. Upload images in Django admin.'))
