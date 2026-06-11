/** Display name for customer records (supports legacy first/last). */
export const customerDisplayName = (customer) => {
  if (!customer) return '';
  if (customer.full_name?.trim()) return customer.full_name.trim();
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
};

export const customerInitials = (customer) => {
  const name = customerDisplayName(customer);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || '?').toUpperCase();
};

export const buildCustomerPayload = ({ full_name, cnic, email, phone, address, notes }) => ({
  full_name: (full_name || '').trim(),
  cnic: (cnic || '').trim(),
  phone: (phone || '').trim(),
  email: (email || '').trim() || null,
  address: (address || '').trim(),
  notes: notes || '',
});

/** Guest House - full name, phone, and CNIC required; address optional. */
export const validateGhCustomerForm = ({ full_name, cnic, phone, email }) => {
  const errors = {};
  if (!full_name?.trim()) errors.full_name = 'Full name is required.';
  if (!phone?.trim()) errors.phone = 'Phone number is required.';
  if (!cnic?.trim()) errors.cnic = 'CNIC is required.';
  if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
};
