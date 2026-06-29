import re

PK_MOBILE_RE = re.compile(r'^03\d{9}$')


def normalize_pk_phone(phone):
    digits = re.sub(r'\D', '', str(phone or ''))
    if digits.startswith('0092'):
        digits = f'0{digits[4:]}'
    elif digits.startswith('92') and len(digits) >= 12:
        digits = f'0{digits[2:]}'
    return digits[:11]


def format_pk_phone(phone):
    digits = normalize_pk_phone(phone)
    if len(digits) <= 4:
        return digits
    return f'{digits[:4]} {digits[4:]}'


def validate_pk_phone(phone, *, required=True):
    digits = normalize_pk_phone(phone)
    if not digits:
        return 'Phone number is required.' if required else None
    if len(digits) != 11:
        return 'Enter 11 digits (e.g. 0300 1234567).'
    if not PK_MOBILE_RE.match(digits):
        return 'Enter a valid mobile number starting with 03.'
    return None
