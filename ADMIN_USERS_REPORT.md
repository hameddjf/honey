# Admin User Management — Change Report

Connects `/admin/users` to the real Django backend. Staff can now list every
user, change a user's role (customer ⇄ staff), and delete a user, all
enforced server-side. Admin V2 visual design is unchanged.

## Files changed

**Backend**
- `backend/accounts/serializers.py` — added `AdminUserSerializer` (read) and
  `AdminUserRoleUpdateSerializer` (write).
- `backend/accounts/views.py` — added `AdminUserViewSet`.
- `backend/accounts/admin_urls.py` — routes `AdminUserViewSet` at `admin/users`.
- `backend/config/urls.py` — includes `accounts.admin_urls`.
- `backend/accounts/tests/test_accounts.py` — added `AdminUserManagementTests`
  (15 tests).
- No migrations — no model changes; role is derived from the existing
  `is_staff` / `is_superuser` flags.

**Frontend**
- `frontend/lib/api/adminUsers.js` — thin wrapper around the shared `api`
  client (`listUsers`, `setUserRole`, `deleteUser`).
- `frontend/app/admin/users/AdminUsersClient.js` — rewritten to call the real
  API instead of `localStorage`. Loading/empty/error states, a real delete
  confirmation (`ConfirmDialog`), and toast feedback — reusing the same
  primitives as `/admin/customers` and `/admin/products`.
- `frontend/lib/auth.js` — removed the demo-only `listUsers`/`setUserRole`/
  `deleteUser` re-export.
- `frontend/lib/authDemoOnly.js` — deleted (no longer used anywhere).
- `frontend/components/admin/ui.js` — added `staff`/`customer`/`superuser`
  entries to `StatusBadge`'s tone map (additive; existing `admin`/`user`
  entries used by `/admin/profile` are untouched).

## API endpoints added

Base: `/api/v1/admin/users/` (staff-only; JWT auth).

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/users/` | List all users (customers, staff, superusers). Supports `?search=`, `?ordering=`, `?is_staff=`, `?is_active=`, `?page_size=`. |
| GET | `/admin/users/{id}/` | Retrieve one user. |
| PATCH | `/admin/users/{id}/` | Body: `{"role": "customer" \| "staff"}`. Only field accepted. |
| DELETE | `/admin/users/{id}/` | Delete a user. |

`POST`/`PUT` are disabled (`405`) — account creation stays on
`/accounts/register/`, and `role` is the only writable field.

## Permission rules

- Every action requires an authenticated staff user — anonymous → `401`,
  non-staff → `403`.
- `role` accepts only `"customer"`/`"staff"`. `is_superuser` isn't a field
  on the write serializer at all, so no request body can grant superuser
  access.
- A staff member can never change their own role or delete their own
  account (`403`).
- No superuser account can be role-changed or deleted through this
  endpoint by anyone (`403`) — the frontend also disables these controls
  for superuser rows.
- The response never includes password/OTP/reset-token fields — they're
  simply not declared on the serializer.

## Test / build results

- `python manage.py check` — clean.
- `python manage.py test` — 93/93 passed at the time (full suite, including
  the new 15-test class).
- `npm run build` — succeeded, all routes generated including `/admin/users`.

## Remaining limitations

- No superuser promotion anywhere in this UI/API — backend-only
  (`createsuperuser`), by design.
- No bulk actions, no audit log of role changes/deletions.
- Frontend requests `page_size=200` rather than implementing paged
  navigation — fine at MVP scale.
