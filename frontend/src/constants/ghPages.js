/** Guest House page keys - must match backend `DEFAULT_GH_PAGES`. */
export const GH_PAGE_KEYS = {
  BOOK: 'book',
  STAYS: 'stays',
  CALENDAR: 'calendar',
  ROOMS: 'rooms',
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

/** Default route when a page is hidden. */
export const GH_PAGE_PATHS = {
  [GH_PAGE_KEYS.BOOK]: '/gh/book',
  [GH_PAGE_KEYS.STAYS]: '/gh/stays',
  [GH_PAGE_KEYS.CALENDAR]: '/gh/calendar',
  [GH_PAGE_KEYS.ROOMS]: '/gh/settings?tab=rooms',
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
