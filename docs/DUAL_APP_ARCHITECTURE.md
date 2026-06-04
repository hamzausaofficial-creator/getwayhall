# Dual app architecture (Marriage Hall + Guest House)

One codebase, two separate products. Login decides which app opens.

## Guest House features (parity with hall)

| Feature | Route | API |
|---------|-------|-----|
| Dashboard | `/gh/dashboard` | `GET /api/guesthouse/stats/` |
| Stays (CRUD) | `/gh/stays`, `/gh/stays/:id` | `/api/guesthouse/stays/` |
| Stay actions | Detail page | `POST .../check_in/`, `check_out/`, `cancel/`, `confirm/` |
| Calendar | `/gh/calendar` | `GET /api/guesthouse/calendar/` |
| Rooms | `/gh/rooms` | `/api/guesthouse/rooms/` |
| Customers | `/gh/customers` | `/api/customers/` (shared) |
| Payments | `/gh/payments` | `/api/guesthouse/payments/` |
| Expenses | `/gh/expenses` | `/api/guesthouse/expenses/` |
| Reports | `/gh/reports` | `GET /api/guesthouse/reports/` |
| Print invoice | `/gh/print/:stayId` | stay detail |
| Staff / Profile / Settings | `/gh/staff`, etc. | shared auth |
| Search (header) | — | `GET /api/guesthouse/search/` |
| Notifications | header bell | `GET /api/guesthouse/alerts/` |

## Login

- `app_type`: `MARRIAGE_HALL` | `GUEST_HOUSE`
- Test: `python create_guesthouse_admin.py` → `gh_admin` / `gh_admin123`

## Not in Guest House (by design)

- Halls / venues, decoration packages, inventory, SMS log (hall-specific)
