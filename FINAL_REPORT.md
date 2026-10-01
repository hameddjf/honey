# Nika Honey — MVP Mode 2 — Final Report

Scope: Django backend only, built on top of the completed MVP Mode 1
foundation. The Next.js frontend (`frontend/`) was **not** modified —
it is repackaged here unchanged, purely so both projects ship together
in one place.

---

## A. Features implemented

- **Order management:** listing, detail, customer order history, staff
  order listing/detail, controlled status workflow, ownership checks,
  filtering (status, payment status, date range), search (staff, by
  customer email/name), pagination, ordering.
- **Order status workflow:** `pending → confirmed → preparing → shipped
  → delivered`, with `cancelled` reachable only from the early stages.
  Enforced server-side; staff-only; customers cannot change status.
- **Products:** category/active/featured filters (already present in
  Mode 1) plus new price-range and stock-availability filters, search,
  and ordering (price, date, name, stock).
- **Product management (staff):** create/update/activate-deactivate,
  price/stock changes, category assignment, featuring, description edits
  — all via the existing `ProductViewSet` (Mode 1 already supported this
  through DRF's `ModelViewSet`; Mode 2 adds the filtering/search/ordering
  around it).
- **Categories:** list/retrieve/staff CRUD (Mode 1), now with a
  `product_count` field.
- **Customer management (staff):** list/search/retrieve customers with
  order-count stats and recent-order history; customers isolated to
  their own data.
- **User profile:** `PATCH /accounts/me/` (full name, phone only —
  role/privilege fields are structurally excluded, not just filtered),
  `POST /accounts/me/change-password/` (requires current password, runs
  Django's password validators).
- **Auth:** login/refresh (Mode 1) plus new logout (refresh-token
  blacklist).
- **Admin/staff API foundation:** staff-only permissions on order status
  changes and the customer list; existing staff permissions on
  products/categories retained.
- **Storefront content (new `content` app):** a singleton `SiteContent`
  record (hero, topbar, contact info, socials, footer, promo banner)
  with public GET and staff-only PATCH/PUT.
- **Seed/demo data:** extended to add a staff user, one demo order per
  workflow stage, and default storefront content — all idempotent.
- **Shipping/payment foundation:** `shipping_address` / `contact_phone`
  captured at checkout; `payment_status` kept explicitly separate from
  order `status` (no gateway, no shipping-provider integration).

## B. Database changes

- `orders.Order.status` choices changed from
  `pending/paid/shipped/delivered/cancelled` to
  `pending/confirmed/preparing/shipped/delivered/cancelled` (splits
  fulfillment from payment state — `payment_status` already covered
  "paid").
- `orders.Order` gained `shipping_address` (CharField, blank) and
  `contact_phone` (CharField, blank).
- New app `content` with one model, `SiteContent` (singleton, pk=1).
- `rest_framework_simplejwt.token_blacklist` app added (its own
  migrations, for refresh-token blacklisting).
- **Migrations:** `orders/migrations/0002_...` (schema),
  `orders/migrations/0003_migrate_legacy_paid_status.py` (data migration,
  non-destructive: any existing `status="paid"` row is moved to
  `"confirmed"`; no-op on a fresh database), `content/migrations/0001_initial.py`.
- No destructive migrations. No existing data was reset or deleted.

## C. API endpoints added/changed

See [`backend/docs/API.md`](backend/docs/API.md) for the full reference.
Summary of what's new vs. Mode 1:

| New/changed endpoint | Notes |
|---|---|
| `PATCH /orders/{id}/status/` | staff-only status transitions |
| `GET /orders/` | now supports filter/search/ordering/pagination |
| `GET /products/` | new `price_min`/`price_max`/`in_stock` filters, ordering |
| `GET /categories/` | now reports `product_count` |
| `PATCH /accounts/me/` | new — profile update |
| `POST /accounts/me/change-password/` | new |
| `POST /accounts/logout/` | new — blacklists refresh token |
| `GET /customers/`, `GET /customers/{id}/` | new — staff only |
| `GET /content/`, `PATCH/PUT /content/` | new app — public GET, staff write |

## D. Authentication/permissions

- No change to the authentication mechanism (SimpleJWT, email-based
  custom user). Added refresh-token blacklisting for logout and for
  rotated tokens.
- New permission classes in `core/permissions.py`: `IsStaffUser`,
  `IsOwnerOrStaff` (generalized from the order-specific version in
  Mode 1).
- Customers can never gain staff privileges through any API input —
  `ProfileUpdateSerializer` doesn't declare `is_staff`/`is_superuser`/
  `email`/id fields at all, so they're dropped silently rather than
  merely rejected.

## E. Order workflow

`pending → confirmed → preparing → shipped → delivered`; `cancelled`
reachable from `pending`/`confirmed`/`preparing` only. All transition
rules live in one place (`orders/services.ALLOWED_STATUS_TRANSITIONS`),
not a workflow engine. `payment_status` remains a separate field
(`unpaid`/`paid`/`failed`/`refunded`) with no gateway wired up.

## F. Product functionality

Filtering by category, active state, featured state, price range, and
stock availability; text search; ordering by price/date/name/stock;
staff CRUD unchanged from Mode 1 but now sitting behind the richer
filter set.

## G. Customer functionality

Staff: list/search/retrieve with order-count and recent-order history.
Customers: view/update their own profile, change their own password,
view their own order history — never another customer's data.

## H. Content functionality

One flexible record for storefront chrome (hero, topbar, contact,
socials, footer, promo). Public read, staff write. Deliberately not a
general-purpose CMS.

## I. Seed/demo strategy

`python manage.py seed_demo` remains a single, idempotent, centralized
command (`products/management/commands/seed_demo.py`). It now also
creates a staff account, one demo order per fulfillment stage for the
demo customer, and default storefront content — all keyed so re-running
the command updates rather than duplicates.

## J. Tests executed

`python manage.py test` — **REAL EXECUTION**, run against the sqlite3
fallback (see Known Limitations). 59 tests total (26 carried over
unmodified from Mode 1 + 33 new for Mode 2), covering:

- Products: list, retrieve, price-range/in-stock filters, ordering,
  staff-only modification, customer/anonymous read-only access,
  category product-count.
- Orders: customer order history, ownership isolation, staff full
  access, staff filter/search, valid status transitions (full sequence),
  invalid/out-of-order transitions rejected, cancellation allowed early
  and rejected after shipping, non-staff/anonymous blocked from status
  changes.
- Customers: own-profile update (and rejection of privilege-field
  injection), password change (correct/incorrect old password, weak
  new password rejected), staff list/search/retrieve with order stats,
  non-staff/anonymous blocked.
- Auth: login, refresh, logout (blacklist verified by a subsequent
  refresh attempt failing).
- Content: public read, singleton enforcement, staff-only write,
  non-staff/anonymous blocked.

## K. Test results

**All 59 tests pass.** `manage.py check` reports no issues.
`manage.py makemigrations --check` reports no pending model changes
(migrations are complete and committed).

## L. Known limitations

- **Postgres not available in this build environment** (same limitation
  noted in the Mode 1 README) — all automated tests and the manual API
  smoke test ran against the sqlite3 fallback. The Postgres connection
  code path is unchanged from Mode 1 and passes Django's config checks,
  but has not been exercised against a live Postgres server. Run
  `python manage.py migrate` against real Postgres as a first step.
- **Lint/format tooling unavailable**: no flake8/black/ruff/etc. is
  declared in `requirements.txt` for this project, so a lint/format
  pass was not part of this delivery's verification (see the Verification
  matrix below).
- No real payment gateway, shipping-provider integration, SMS/email
  automation, coupons, recommendation engine, or advanced analytics —
  all explicitly out of scope per the project brief.
- The status-transition rule set is a flat lookup table, not a
  configurable workflow engine, by design (see project brief §3).
- `search` on orders does not include `order_number` (a UUID field) to
  avoid unreliable substring matching against non-text columns; use the
  `status`/`payment_status`/date filters or the order's numeric `id`
  for that instead.

## M. REAL / PARTIAL / DEMO / NOT IMPLEMENTED matrix

| Feature | Status |
|---|---|
| Order listing/detail/history | REAL |
| Order status workflow + staff transition endpoint | REAL |
| Order ownership enforcement | REAL |
| Product filtering/search/ordering | REAL |
| Staff product management | REAL |
| Category management + product_count | REAL |
| Customer profile update | REAL |
| Password change | REAL |
| Staff customer list/detail | REAL |
| JWT login/refresh/logout | REAL |
| Storefront content API | REAL |
| Seed/demo data command | REAL (dev/demo only, never production data) |
| Server-side pricing | REAL (unchanged from Mode 1) |
| Shipping cost calculation | DEMO (flat `0.00` placeholder only — see project brief §14) |
| Payment status field | PARTIAL (state representation only, no gateway) |
| Postgres in production | PARTIAL (code path complete, unverified live in this sandbox) |
| Lint/format check | NOT IMPLEMENTED (no tooling configured in this project) |
| Real payment gateway | NOT IMPLEMENTED (out of scope, by design) |
| Shipping-provider integration | NOT IMPLEMENTED (out of scope, by design) |
| SMS/email automation, coupons, RBAC, analytics, etc. | NOT IMPLEMENTED (out of scope, by design) |

## N. Exact local run commands

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit as needed
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
# in another shell:
python manage.py test
```

Frontend (unchanged, not part of this phase):

```bash
cd frontend
npm install
npm run dev
```

## O. Recommended next phase

Per the project brief, Mode 2 is now complete and the next phases
(not started here) would be: the comprehensive security/performance
audit, the real Next.js ↔ Django integration, and — only if actually
needed — the explicitly-deferred features (payments, shipping provider,
SMS/email, coupons, RBAC, analytics).
