# Nika Honey — MVP Mode 3 — Frontend ↔ Django Integration Report

Scope: connect the existing approved Next.js frontend to the existing
Django + DRF backend (Mode 2). SQLite only. No Docker/Postgres/Redis/
Celery introduced. No redesign of the public site or Admin V2.

---

## A. Frontend → Backend architecture

- Next.js (client components) ↔ `NEXT_PUBLIC_API_URL` (`http://127.0.0.1:8000/api/v1`
  in local dev, see `frontend/.env.local`) ↔ Django REST Framework ↔ SQLite.
- `frontend/lib/api/client.js`: single fetch wrapper. Stores JWT access/refresh
  tokens in `localStorage`, attaches `Authorization: Bearer`, transparently
  retries once after a silent refresh on `401`, and normalizes DRF error
  payloads into a single `ApiError`.
- Domain-specific API modules sit on top of it: `lib/api/orders.js`,
  `lib/api/adminProducts.js`, `lib/api/adminCustomers.js`, `lib/api/content.js`,
  `lib/api/products.js`. UI components never call `fetch` or build headers
  directly.
- `lib/products.js`, `lib/auth.js`, `lib/siteContent.js` are the
  "consumer-facing" layer: same function signatures the UI already used,
  now backed by real API calls instead of `localStorage`. This kept changes
  to page components minimal.
- Cosmetic-only product data (images, taglines, benefit icons — not
  commercial data) stays in `lib/productsCosmetic.js` and is merged onto the
  live Django product by name; it is never sent to or read from the backend.

## B. API endpoints used

Auth: `POST /accounts/register/`, `POST /accounts/login/`,
`POST /accounts/login/refresh/`, `POST /accounts/logout/`, `GET/PATCH /accounts/me/`,
`POST /accounts/me/change-password/`.
Catalog: `GET /categories/`, `GET/POST/PATCH/DELETE /products/`.
Orders: `GET/POST /orders/`, `PATCH /orders/{id}/status/`.
Customers (staff): `GET /customers/`, `GET /customers/{id}/`.
Content: `GET /content/` (public), `PATCH /content/` (staff).
No new backend endpoints were added — everything needed already existed
from Mode 2.

## C. Authentication flow

Email/password → `login/` returns `{access, refresh}` → stored in
`localStorage` → `GET /accounts/me/` populates a small cached session object
(`{id, name, email, phone, role}`) used for synchronous UI checks (nav,
route guards) → `refreshSession()` re-validates against the server where it
matters (account page, admin route guard) so a stale cache can't grant
access after a revoked/expired token. `AdminLayout` now checks `is_staff`
from the server, not just a cached flag. Logout blacklists the refresh
token server-side.

## D. Product data flow

`GET /products/` → `lib/products.js` merges live price/stock/category/name
with cosmetic metadata by a fixed name→slug map (so `/product/citrus` etc.
keep working) → home, shop, product-detail, and admin-products all read
from this one source. Admin create/update/delete goes straight to
`/products/` (`ModelViewSet`), staff-only, verified against the live
permission check (customer `POST /products/` → `403`, confirmed live).

## E. Cart/checkout flow

Cart stays client-side (as specified) but item identity is the real
product's stable slug, and displayed prices/line totals are computed from
the live catalog fetched at checkout time — not from stale cart state.
Checkout submits only `{product_id, quantity}` pairs (plus shipping
address/phone/guest email) to `POST /orders/`; the server is the only
authority for unit price, subtotal, shipping, and total (unchanged from
Mode 2's `orders/services.py`). Guest checkout (no login) requires an email
field, added to the form since the backend requires either an authenticated
user or a `guest_email`.

## F. Order flow

Order creation returns the full server-computed order, which is mapped into
the shape the existing Invoice/Account UI already expected
(`lib/api/orders.js: mapOrder`) — order number, items, subtotal, shipping,
total, status. Account → "My Orders" now calls `GET /orders/` (auth
required) instead of reading `localStorage`. Status labels
(pending/confirmed/preparing/shipped/delivered/cancelled) come straight
from the backend's `Order.Status` choices.

## G. Admin integration

- **Products**: full CRUD against `/products/` and `/categories/`, staff-only,
  live-tested (create → update stock → delete, all 2xx; non-staff → 403).
- **Orders**: list/detail/status-change against `/orders/`, live-tested
  (status transition `confirmed → preparing` succeeded server-side).
- **Customers**: read-only list/detail with order history against
  `/customers/`, live-tested.
- **Content**: hero/topbar/contact/social/footer/promo fields read and
  saved against `/content/`, live-tested (PATCH round-tripped correctly).
  Fields with no backend column (intro video, hero/promo button label+link)
  remain local-only, as flagged inline in the admin UI's own "demo note".
- Admin V2's layout, navigation, and three-theme system were not touched —
  only data sources were swapped.

## H. Content integration

`lib/siteContent.js` merges local-only fields with live `GET /content/` data.
The **admin content editor** is fully connected. The **public storefront
pages** (home hero, topbar, footer) are still the original static
`_bodyContent.js` markup and do not yet read from this API — this is called
out explicitly in the admin UI itself ("چون صفحه‌ی اصلی سایت هنوز استاتیک
است..."). Wiring the public pages to `/content/` is the main piece of
section 15/17 left for a follow-up pass.

## I. Mock Data Center behavior

Untouched and still available (`/admin/mockdata`, `lib/adminProducts.js`,
`resetSiteContent`) for local demo/prototype use, per the brief. It no
longer affects the real Admin Products/Content screens, which now read
from Django — only the (separate, still-local) `/admin/users` screen and
`resetSiteContent`'s local-only fields still go through it.

## J. SQLite status

Confirmed SQLite-only: `.env`'s Postgres variables (present in
`.env.example`, which would have silently switched the DB engine) were
commented out for this MVP. `DATABASES['default']['ENGINE']` verified as
`django.db.backends.sqlite3` at runtime. `migrate` and `seed_demo` both run
cleanly against it.

## K. Tests actually executed — REAL EXECUTION

- `python manage.py test` — **59/59 passing**, run against SQLite (not
  mocked), after all frontend integration work (re-run at the end to
  confirm no regressions from live smoke testing).
- `python manage.py check` — no issues.
- `python manage.py migrate` — clean on a fresh SQLite file.
- Live curl-driven contract tests against a running `runserver` (not unit
  tests — real HTTP calls matching exactly what the frontend code sends):
  register → login → me → list products → create order → list orders →
  refresh token; staff login → list categories → create/update/delete
  product → confirmed customer-role `403` on write; staff → list customers
  → customer detail with recent orders; public `GET /content/` → staff
  `PATCH /content/`; staff → order status transition. All matched the
  exact request/response shapes the frontend code sends and expects.
- `npm run build` (Next.js production build, Turbopack) — succeeds, all 43
  routes generate.
- `npx eslint .` — no new errors introduced by this integration; a
  pre-existing project-wide baseline of `react-hooks/set-state-in-effect`
  findings (Next 16's stricter default lint config) applies equally to
  code untouched in this phase (confirmed by testing an unmodified file
  with the same pattern) — 19 errors / 15 warnings project-wide before and
  after this work, not a regression.
- **NOT executed**: an actual browser click-through. I do not have a
  working headless browser in this environment (Playwright's browser
  download hit a blocked network domain) — so end-to-end UI behavior is
  verified via the build succeeding, all routes returning `200` from a
  live `next dev` server, and the API contract matching exactly what the
  browser-side code calls, not via a real rendered screenshot or click
  trace. This is the honest boundary of what was verified.

## L. Build/lint results

- Backend: `check` clean, `test` 59/59, `migrate` clean.
- Frontend: `next build` succeeds (43 routes); `eslint` has no
  integration-introduced errors (see K).

## M. Known limitations

- `/forgot-password` and `/admin/users` (role change / delete) remain on
  the old local-only demo behavior — the backend has no public
  "email exists" check, no email-token password-reset flow, and no
  staff-role-management endpoint. Adding these was out of scope for
  "only add backend endpoints when required for integration"; flagged in
  code comments (`lib/authDemoOnly.js`).
- Public storefront pages (home/shop/product chrome — hero text, topbar,
  footer) still render the original static markup, not `/content/` (admin
  content editing is fully wired; the public read-side isn't yet — see H).
- Checkout collects name/city/postal-code as separate fields, but
  `Order` only stores one `shipping_address` string + `contact_phone` (no
  dedicated name field on the model) — they're concatenated into
  `shipping_address` on submit; the customer's display name for an order
  comes from `customer_email` on the backend, not a stored name.
- No real payment gateway (as specified) — `payment_method`/`payment_status`
  stay foundation-only.
- No browser-based (Playwright/manual) click-through was performed — see K.

## N. Exact commands to run both services

Backend:
```
cd backend
python -m venv .venv && source .venv/bin/activate   # or your preferred venv tool
pip install -r requirements.txt
cp .env.example .env   # then make sure POSTGRES_* stays commented out for SQLite
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Frontend:
```
cd frontend
npm install
cp .env.local.example .env.local   # or create with NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
npm run dev
```

Demo accounts (from `seed_demo`): `demo@nikahoney.local` / `demo-pass-123`
(customer), `staff@nikahoney.local` / `staff-pass-123` (staff/admin panel).

## O. What remains before the MVP can be considered fully online

1. Wire the public storefront chrome (hero/topbar/footer) to `GET /content/`
   (admin editing already works — only the public read side is left).
2. Decide on and build `/forgot-password` and admin user-role-management
   properly (needs new, deliberately-scoped backend endpoints).
3. A real browser/manual QA pass — everything here was verified via build
   success, live HTTP contract tests, and route-level smoke tests, not a
   rendered click-through.
