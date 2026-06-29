from customers.models import Customer
from .models import StayGuest


def _find_customer_by_cnic(tenant, cnic):
    cnic = (cnic or '').strip()
    if not cnic or not tenant:
        return None
    return Customer.objects.filter(tenant=tenant, cnic=cnic).first()


def _guest_entry_filled(entry):
    if entry.get('customer') or entry.get('customer_id'):
        return True
    if entry.get('is_minor'):
        return bool((entry.get('full_name') or '').strip())
    return bool((entry.get('full_name') or '').strip() and (entry.get('cnic') or '').strip())


def _enrich_guest_entry(entry, tenant):
    data = dict(entry)
    customer_id = data.get('customer') or data.get('customer_id')
    if customer_id and tenant:
        customer = Customer.objects.filter(pk=customer_id, tenant=tenant).first()
        if customer:
            data['customer'] = customer.id
            data['full_name'] = (data.get('full_name') or '').strip() or customer.display_name
            data['cnic'] = (data.get('cnic') or '').strip() or (customer.cnic or '')
            data['phone'] = (data.get('phone') or '').strip() or (customer.phone or '')
            data['address'] = (data.get('address') or '').strip() or (customer.address or '')
            data['is_minor'] = bool(data.get('is_minor') or customer.is_minor)
    return data


def _resolve_linked_primary(tenant, entry, fallback_customer=None):
    linked_id = entry.get('linked_primary') or entry.get('linked_primary_id')
    if linked_id and tenant:
        primary = Customer.objects.filter(pk=linked_id, tenant=tenant).first()
        if primary:
            return primary
    return fallback_customer


def _resolve_customer(tenant, entry, *, is_primary=False, fallback_customer=None):
    customer_id = entry.get('customer') or entry.get('customer_id')
    if customer_id and tenant:
        customer = Customer.objects.filter(pk=customer_id, tenant=tenant).first()
        if customer:
            return customer

    is_minor = bool(entry.get('is_minor'))
    linked_primary = _resolve_linked_primary(tenant, entry, fallback_customer)

    if is_minor:
        full_name = (entry.get('full_name') or '').strip()
        address = (entry.get('address') or '').strip()
        if not full_name or not tenant:
            return None
        phone = (entry.get('phone') or '').strip()
        if not phone and linked_primary:
            phone = (linked_primary.phone or '').strip()
        if not phone:
            phone = '—'
        return Customer.objects.create(
            tenant=tenant,
            full_name=full_name,
            first_name=full_name,
            last_name='',
            cnic='',
            phone=phone,
            address=address or None,
            is_minor=True,
            linked_primary=linked_primary,
        )

    cnic = (entry.get('cnic') or '').strip()
    if cnic and tenant:
        existing = _find_customer_by_cnic(tenant, cnic)
        if existing:
            if linked_primary and not existing.linked_primary_id:
                existing.linked_primary = linked_primary
                existing.save(update_fields=['linked_primary'])
            return existing

    if is_primary and fallback_customer:
        return fallback_customer

    full_name = (entry.get('full_name') or '').strip()
    phone = (entry.get('phone') or '').strip()
    if not full_name or not phone or not tenant:
        return None

    return Customer.objects.create(
        tenant=tenant,
        full_name=full_name,
        first_name=full_name,
        last_name='',
        cnic=cnic,
        phone=phone,
        address=(entry.get('address') or '').strip() or None,
        is_minor=False,
        linked_primary=linked_primary,
    )


def ensure_primary_guest_row(stay):
    if stay.guest_roster.exists() or not stay.customer_id:
        return
    customer = stay.customer
    StayGuest.objects.create(
        stay=stay,
        customer=customer,
        full_name=customer.display_name,
        cnic=customer.cnic or '',
        phone=customer.phone or '',
        address=customer.address or '',
        is_minor=bool(customer.is_minor),
        is_primary=True,
        sort_order=0,
    )


def sync_stay_guests(stay, guests_data):
    tenant = stay.tenant
    if not guests_data:
        ensure_primary_guest_row(stay)
        return

    normalized = []
    for index, raw in enumerate(guests_data):
        if not _guest_entry_filled(raw):
            continue
        entry = _enrich_guest_entry(raw, tenant)
        if 'is_primary' not in entry:
            entry['is_primary'] = index == 0
        normalized.append(entry)

    if not normalized:
        ensure_primary_guest_row(stay)
        return

    if not any(g['is_primary'] for g in normalized):
        normalized[0]['is_primary'] = True

    normalized.sort(key=lambda g: (0 if g.get('is_primary') else 1))

    primary_customer = None
    stay.guest_roster.all().delete()

    for sort_order, entry in enumerate(normalized):
        is_primary = bool(entry.get('is_primary'))
        customer = _resolve_customer(
            tenant,
            entry,
            is_primary=is_primary,
            fallback_customer=stay.customer if is_primary else stay.customer,
        )

        full_name = (entry.get('full_name') or '').strip()
        cnic = (entry.get('cnic') or '').strip()
        phone = (entry.get('phone') or '').strip()
        address = (entry.get('address') or '').strip()
        is_minor = bool(entry.get('is_minor'))

        if customer:
            full_name = full_name or customer.display_name
            cnic = cnic or (customer.cnic or '')
            phone = phone or (customer.phone or '')
            address = address or (customer.address or '')
            is_minor = is_minor or bool(customer.is_minor)
            if is_primary:
                primary_customer = customer

        if not full_name:
            continue

        StayGuest.objects.create(
            stay=stay,
            customer=customer,
            full_name=full_name,
            cnic=cnic,
            phone=phone,
            address=address,
            is_minor=is_minor,
            is_primary=is_primary,
            sort_order=sort_order,
        )

    if primary_customer and stay.customer_id != primary_customer.id:
        stay.customer = primary_customer

    stay.guests_count = max(len(normalized), 1)
    stay.save(update_fields=['customer', 'guests_count'])
