/** Guest House page keys - must match backend `DEFAULT_GH_PAGES`. */
export const GH_PAGE_KEYS = {
  BOOK: 'book',
  STAYS: 'stays',
  CALENDAR: 'calendar',
  ROOMS: 'rooms',
  SERVICES: 'services',
  CUSTOMERS: 'customers',
  RECORDS: 'records',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  STAFF: 'staff',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  SETTINGS: 'settings',
};

/** In-app modules (not sidebar routes) — toggled from Django admin alongside pages. */
export const GH_MODULE_KEYS = {
  ID_SCANNER: 'id_scanner',
};

export const GH_MODULE_ORDER = [
  GH_MODULE_KEYS.ID_SCANNER,
];

export const GH_PAGE_LABELS = {
  [GH_PAGE_KEYS.BOOK]: 'Book Stay',
  [GH_PAGE_KEYS.STAYS]: 'Stays',
  [GH_PAGE_KEYS.CALENDAR]: 'Calendar',
  [GH_PAGE_KEYS.ROOMS]: 'Rooms',
  [GH_PAGE_KEYS.SERVICES]: 'Add-on Services',
  [GH_PAGE_KEYS.CUSTOMERS]: 'Guest Directory',
  [GH_PAGE_KEYS.RECORDS]: 'All Records',
  [GH_PAGE_KEYS.PAYMENTS]: 'Payments',
  [GH_PAGE_KEYS.EXPENSES]: 'Expenses',
  [GH_PAGE_KEYS.STAFF]: 'Staff',
  [GH_PAGE_KEYS.REPORTS]: 'Reports',
  [GH_PAGE_KEYS.NOTIFICATIONS]: 'Notifications',
  [GH_PAGE_KEYS.DASHBOARD]: 'Dashboard',
  [GH_PAGE_KEYS.PROFILE]: 'Profile',
  [GH_PAGE_KEYS.SETTINGS]: 'Settings',
};

/** Default route when a page is hidden. */
export const GH_PAGE_PATHS = {
  [GH_PAGE_KEYS.BOOK]: '/gh/book',
  [GH_PAGE_KEYS.STAYS]: '/gh/stays',
  [GH_PAGE_KEYS.CALENDAR]: '/gh/calendar',
  [GH_PAGE_KEYS.ROOMS]: '/gh/settings?tab=rooms',
  [GH_PAGE_KEYS.SERVICES]: '/gh/services',
  [GH_PAGE_KEYS.CUSTOMERS]: '/gh/customers',
  [GH_PAGE_KEYS.RECORDS]: '/gh/settings?tab=records',
  [GH_PAGE_KEYS.PAYMENTS]: '/gh/payments',
  [GH_PAGE_KEYS.EXPENSES]: '/gh/expenses',
  [GH_PAGE_KEYS.STAFF]: '/gh/settings?tab=staff',
  [GH_PAGE_KEYS.REPORTS]: '/gh/reports',
  [GH_PAGE_KEYS.NOTIFICATIONS]: '/gh/notifications',
  [GH_PAGE_KEYS.DASHBOARD]: '/gh/dashboard',
  [GH_PAGE_KEYS.PROFILE]: '/gh/profile',
  [GH_PAGE_KEYS.SETTINGS]: '/gh/settings',
};

export const GH_PAGE_ORDER = [
  GH_PAGE_KEYS.BOOK,
  GH_PAGE_KEYS.STAYS,
  GH_PAGE_KEYS.CALENDAR,
  GH_PAGE_KEYS.ROOMS,
  GH_PAGE_KEYS.SERVICES,
  GH_PAGE_KEYS.CUSTOMERS,
  GH_PAGE_KEYS.RECORDS,
  GH_PAGE_KEYS.PAYMENTS,
  GH_PAGE_KEYS.EXPENSES,
  GH_PAGE_KEYS.STAFF,
  GH_PAGE_KEYS.REPORTS,
  GH_PAGE_KEYS.NOTIFICATIONS,
  GH_PAGE_KEYS.DASHBOARD,
  GH_PAGE_KEYS.PROFILE,
  GH_PAGE_KEYS.SETTINGS,
];
