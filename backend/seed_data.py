import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from api.models import Venue, Customer, Booking, Payment, Expense, Staff

def seed_data():
    print("Seeding data...")
    
    # Clear existing data
    Venue.objects.all().delete()
    Customer.objects.all().delete()
    Booking.objects.all().delete()
    Payment.objects.all().delete()
    Expense.objects.all().delete()
    Staff.objects.all().delete()

    # Create Venues
    venues = [
        Venue.objects.create(name="Grand Ballroom", location="Main Floor", capacity=500, price_per_day=2500, description="Our largest and most luxurious hall."),
        Venue.objects.create(name="Crystal Garden", location="East Wing", capacity=300, price_per_day=1800, description="Beautiful outdoor themed indoor hall."),
        Venue.objects.create(name="Royal Suite", location="Penthouse", capacity=150, price_per_day=1200, description="Intimate space for private events."),
        Venue.objects.create(name="Ocean Terrace", location="Rooftop", capacity=200, price_per_day=1500, description="Open air rooftop with ocean view.")
    ]

    # Create Customers
    customers = [
        Customer.objects.create(first_name="Sarah", last_name="Jenkins", email="sarah@example.com", phone="555-0101"),
        Customer.objects.create(first_name="Michael", last_name="Ross", email="michael@example.com", phone="555-0102"),
        Customer.objects.create(first_name="Emily", last_name="Davis", email="emily@example.com", phone="555-0103"),
        Customer.objects.create(first_name="Robert", last_name="Wilson", email="robert@example.com", phone="555-0104")
    ]

    # Create Bookings
    today = datetime.now().date()
    bookings = []
    for i in range(10):
        v = random.choice(venues)
        c = random.choice(customers)
        days_ahead = random.randint(-30, 60)
        start = today + timedelta(days=days_ahead)
        end = start + timedelta(days=0)
        
        status = 'CONFIRMED' if days_ahead < 0 else 'PENDING'
        
        b = Booking.objects.create(
            venue=v,
            customer=c,
            start_date=start,
            end_date=end,
            total_price=v.price_per_day,
            status=status
        )
        bookings.append(b)

    # Create Payments for confirmed bookings
    for b in Booking.objects.filter(status='CONFIRMED'):
        Payment.objects.create(
            booking=b,
            amount=b.total_price,
            method=random.choice(['CASH', 'CARD', 'BANK_TRANSFER']),
            status='COMPLETED'
        )

    # Create Expenses
    Expense.objects.create(title="AC Maintenance", category="MAINTENANCE", amount=450, expense_date=today - timedelta(days=5))
    Expense.objects.create(title="Electricity Bill", category="UTILITIES", amount=1200, expense_date=today - timedelta(days=2))
    Expense.objects.create(title="Staff Salaries May", category="STAFF_SALARY", amount=8500, expense_date=today - timedelta(days=15))

    # Create Staff
    Staff.objects.create(first_name="John", last_name="Doe", role="MANAGER", email="john@hallora.com", phone="555-9001", salary=3500, hire_date=today - timedelta(days=365))
    Staff.objects.create(first_name="Jane", last_name="Smith", role="RECEPTIONIST", email="jane@hallora.com", phone="555-9002", salary=2000, hire_date=today - timedelta(days=200))

    print("Seeding complete!")

if __name__ == "__main__":
    seed_data()
