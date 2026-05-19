import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from core.models import Tenant
from authentication.models import User, StaffProfile
from venues.models import Venue
from customers.models import Customer
from bookings.models import Booking
from finance.models import Payment, Expense

def seed_db():
    print("Seeding fresh data for modular architecture...")
    
    # 1. Create Tenant
    tenant, _ = Tenant.objects.get_or_create(
        name="Hallora Premier Venues",
        subdomain="premier",
        plan_type="PREMIUM"
    )

    # 2. Create Admin User
    if not User.objects.filter(email="admin@hallora.com").exists():
        admin = User.objects.create_user(
            email="admin@hallora.com",
            password="password123",
            first_name="Alex",
            last_name="Admin",
            role="ADMIN",
            tenant=tenant
        )
        print(f"Created Admin: {admin.email} / password123")
    else:
        admin = User.objects.get(email="admin@hallora.com")

    # 3. Create Venues
    venues_data = [
        {"name": "Grand Ballroom", "location": "Main Floor", "capacity": 500, "price": 2500},
        {"name": "Crystal Garden", "location": "East Wing", "capacity": 300, "price": 1800},
        {"name": "Royal Suite", "location": "Penthouse", "capacity": 150, "price": 1200}
    ]
    
    venues = []
    for v_data in venues_data:
        v, _ = Venue.objects.get_or_create(
            tenant=tenant,
            name=v_data["name"],
            defaults={
                "location": v_data["location"],
                "capacity": v_data["capacity"],
                "price_per_day": v_data["price"],
                "status": "ACTIVE"
            }
        )
        venues.append(v)

    # 4. Create Customers
    customers_data = [
        {"first": "Sarah", "last": "Jenkins", "email": "sarah@gmail.com", "phone": "03001234567"},
        {"first": "Michael", "last": "Ross", "email": "mike@pearson.com", "phone": "03217654321"}
    ]
    
    customers = []
    for c_data in customers_data:
        c, _ = Customer.objects.get_or_create(
            tenant=tenant,
            email=c_data["email"],
            defaults={
                "first_name": c_data["first"],
                "last_name": c_data["last"],
                "phone": c_data["phone"]
            }
        )
        customers.append(c)

    # 5. Create Bookings & Payments
    today = datetime.now()
    for i in range(5):
        v = random.choice(venues)
        c = random.choice(customers)
        start = today + timedelta(days=random.randint(-10, 30))
        
        booking, created = Booking.objects.get_or_create(
            tenant=tenant,
            venue=v,
            start_date=start,
            defaults={
                "end_date": start + timedelta(hours=6),
                "customer": c,
                "event_name": f"Event {i+1}",
                "guest_count": random.randint(50, 300),
                "total_price": v.price_per_day,
                "advance_paid": 500 if i % 2 == 0 else v.price_per_day,
                "booking_status": "CONFIRMED",
                "created_by": admin
            }
        )
        
        if created:
            # Create Payment record
            Payment.objects.create(
                tenant=tenant,
                booking=booking,
                amount=booking.advance_paid,
                payment_method="CASH",
                status="COMPLETED"
            )

    # 6. Create Expenses
    Expense.objects.get_or_create(
        tenant=tenant,
        title="AC Maintenance",
        defaults={"category": "MAINTENANCE", "amount": 450, "expense_date": today.date(), "created_by": admin}
    )

    print("Seeding complete! You can now log in.")

if __name__ == "__main__":
    seed_db()
