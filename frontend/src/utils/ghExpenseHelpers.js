/** Predefined guest house expense voucher templates - select to prefill new voucher. */
export const GH_VOUCHER_TEMPLATES = [
  { id: 'STAFF_SALARY', label: 'Staff salary', category: 'SALARY', title: 'Monthly staff salary', description: 'Housekeeping, reception, security wages' },
  { id: 'ELECTRICITY', label: 'Electricity bill', category: 'UTILITIES', title: 'Electricity bill', description: 'Guest house meter / WAPDA' },
  { id: 'WATER_GAS', label: 'Water & gas', category: 'UTILITIES', title: 'Water / gas bill', description: 'Utility charges' },
  { id: 'GENERATOR_FUEL', label: 'Generator fuel', category: 'UTILITIES', title: 'Generator diesel / fuel', description: 'Backup generator refuel' },
  { id: 'ROOM_MAINTENANCE', label: 'Room maintenance', category: 'MAINTENANCE', title: 'Room repair', description: 'Furniture, AC, plumbing repairs' },
  { id: 'BUILDING_MAINT', label: 'Building maintenance', category: 'MAINTENANCE', title: 'Building maintenance', description: 'Paint, structural, common areas' },
  { id: 'LAUNDRY', label: 'Laundry', category: 'LAUNDRY', title: 'Laundry expense', description: 'Detergent, linen, dry cleaning' },
  { id: 'SUPPLIES', label: 'Room supplies', category: 'SUPPLIES', title: 'Cleaning & room supplies', description: 'Toiletries, towels, amenities' },
  { id: 'MARKETING', label: 'Marketing', category: 'MARKETING', title: 'Marketing / ads', description: 'Online listings, brochures' },
  { id: 'MISC', label: 'Miscellaneous', category: 'OTHER', title: 'Miscellaneous expense', description: '' },
];

export const GH_CATEGORY_LABELS = {
  SALARY: 'Salary',
  UTILITIES: 'Utilities',
  MAINTENANCE: 'Maintenance',
  SUPPLIES: 'Supplies',
  LAUNDRY: 'Laundry',
  MARKETING: 'Marketing',
  OTHER: 'Other',
};

export function getGhTemplateById(id) {
  return GH_VOUCHER_TEMPLATES.find((t) => t.id === id) || null;
}

export function templateToForm(template, { keepAmount = false, amount = '' } = {}) {
  if (!template) return null;
  return {
    title: template.title || '',
    category: template.category || 'OTHER',
    amount: keepAmount ? String(amount ?? '') : '',
    expense_date: new Date().toISOString().split('T')[0],
    description: template.description || '',
  };
}

/** Reuse a saved voucher - same details, fresh date, empty amount for new entry. */
export function expenseToReuseForm(expense) {
  return {
    title: expense?.title || '',
    category: expense?.category || 'OTHER',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: expense?.description || '',
  };
}

export function voucherDisplayId(expenseId) {
  return `EXP-${String(expenseId).padStart(5, '0')}`;
}
