export const TIER_LABELS = {
  ESSENTIAL: 'Essential',
  CLASSIC: 'Classic',
  PREMIUM: 'Premium',
  ROYAL: 'Royal',
  CUSTOM: 'Custom quote',
};

export const TIER_STYLES = {
  ESSENTIAL: { bg: '#f1f5f9', color: '#475569' },
  CLASSIC: { bg: '#dbeafe', color: '#1e40af' },
  PREMIUM: { bg: '#fef3c7', color: '#92400e' },
  ROYAL: { bg: '#ede9fe', color: '#5b21b6' },
  CUSTOM: { bg: '#fce7f3', color: '#9d174d' },
};

export const linesToItems = (text) =>
  String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

export const itemsToLines = (items) =>
  Array.isArray(items) && items.length ? items.join('\n') : '';

export const emptyPackageForm = {
  name: '',
  tier: 'CLASSIC',
  description: '',
  included_lines: '',
  base_price: 0,
  setup_hours: 4,
  is_active: true,
  display_order: 0,
};

export const parsePackageToForm = (pkg) => ({
  name: pkg.name,
  tier: pkg.tier,
  description: pkg.description || '',
  included_lines: itemsToLines(pkg.included_items),
  base_price: pkg.base_price,
  setup_hours: pkg.setup_hours ?? 4,
  is_active: Boolean(pkg.is_active),
  display_order: pkg.display_order ?? 0,
});
