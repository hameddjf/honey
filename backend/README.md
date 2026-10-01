# Nika Honey — Backend (Django + DRF)

API-first backend for the Nika Honey project. This is a separate project
from the existing Next.js frontend (`../nika-honey`) and communicates
with it only through JSON REST APIs under `/api/v1/`. Nothing here
modifies or depends on the frontend code.

This is **MVP Mode 2**, built on top of the completed Mode 1 foundation:
real order management (status workflow, staff order tools, customer
order history), a functional product/category API (filtering, search,
ordering), customer management foundation, profile/password management,
JWT logout, and a lightweight storefront-content API. Payments, SMS,
email automation, coupons, a shipping-provider integration, and similar
features are still intentionally not built — see "What's intentionally
not implemented" below.

## Stack

- Django 5.2 + Django REST Framework
- PostgreSQL (sqlite3 fallback for zero-setup local dev)
- SimpleJWT for token authentication (with refresh-token blacklisting)
- django-cors-headers, django-filter

## Project layout

```
backend/
  config/                 # project configuration
    settings/
      base.py             # shared settings, all env-driven
      development.py
      production.py
    urls.py                # root URLconf, mounts /api/v1/
  core/                    # shared abstract models, health check, permissions
  accounts/                # custom User model, auth, profile, customers (staff)
  products/                # Category, Product, filters
  orders/                  # Order, OrderItem, status workflow, pricing service
  content/                 # SiteContent singleton (storefront chrome)
  docs/
    API.md                 # full endpoint reference
  requirements.txt
  .env.example
```

## Setup

### 1. Python environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables

```bash
cp .env.example .env
# then edit .env with real values
```

`.env` is never committed. If no `DATABASE_URL` or `POSTGRES_DB` is set,
the project automatically falls back to a local `db.sqlite3` file so it
can run without any database setup — useful while iterating, but use
Postgres for anything beyond that.

### 3. PostgreSQL setup

Create a database and user matching your `.env`:

```sql
CREATE DATABASE nika_honey;
CREATE USER nika_honey WITH PASSWORD 'nika_honey';
GRANT ALL PRIVILEGES ON DATABASE nika_honey TO nika_honey;
```

Then either set `DATABASE_URL=postgres://nika_honey:nika_honey@localhost:5432/nika_honey`
or the discrete `POSTGRES_*` variables in `.env`.

### 4. Migrations

```bash
python manage.py migrate
```

This includes a one-time, non-destructive data migration that moves any
Mode-1 orders with the old `status="paid"` value to `"confirmed"` (Mode 2
splits order status from payment status — see `orders/models.py`). It is
a no-op on a fresh database.

### 5. Seed/demo data

```bash
python manage.py seed_demo
```

Creates the current honey catalog (categories + products), a demo
customer (`demo@nikahoney.local` / `demo-pass-123`), a demo staff user
(`staff@nikahoney.local` / `staff-pass-123`), one demo order per
fulfillment stage for the demo customer, and default storefront content.
Safe to re-run — it updates existing rows instead of duplicating them,
and is dev/demo data only, never a source of production data.

### 6. Run the development server

```bash
python manage.py runserver
```

API base path: `http://localhost:8000/api/v1/`
Django Admin: `http://localhost:8000/admin/` (create an admin with
`python manage.py createsuperuser`)

### 7. Run tests

```bash
python manage.py test
```

## API documentation

See [`docs/API.md`](docs/API.md) for the full endpoint reference
(method, path, auth, permission, request/response shape, common errors).

## Order status workflow

`pending → confirmed → preparing → shipped → delivered`, with
`cancelled` reachable from `pending`/`confirmed`/`preparing` only.
Transitions are enforced server-side in `orders/services.py`
(`ALLOWED_STATUS_TRANSITIONS`) — invalid or out-of-order moves are
rejected with 400. Only staff can change order status
(`PATCH /orders/{id}/status/`); customers never can.

Order status and payment status are deliberately separate fields —
`payment_status` (`unpaid`/`paid`/`failed`/`refunded`) tracks money,
`status` tracks fulfillment. Neither is a real payment gateway; both
are foundations for a later phase.

## Authentication foundation

- Custom `accounts.User` model, identified by email (no username field).
- Passwords are always handled through Django's built-in hashing —
  nothing is stored or compared manually.
- JWT (SimpleJWT) is the primary API authentication method; refresh
  tokens are blacklisted on rotation and on explicit logout
  (`POST /accounts/logout/`). Session auth is also enabled for Django
  Admin / browsable API convenience.

## Permission foundation

- Anonymous: read-only access to categories/products, can place guest orders.
- Authenticated customer: read-only on catalog, full access to their own
  orders and profile only; can change their own password.
- Staff (`is_staff=True`): full read/write on catalog and orders via the
  API (including status transitions), read access to the customer list,
  full management access via Django Admin.

This intentionally does not build a granular role/permission matrix yet —
Django's built-in `is_staff` / `is_superuser` / groups are enough for
this stage.

## What's intentionally NOT implemented (by design, for this MVP stage)

- Real payment gateway integration
- Shipping-provider integration
- SMS / email automation
- Coupons, advanced inventory, analytics
- Recommendation engine, loyalty program, marketing automation
- Full-text search engine, background workers, microservices
- A granular RBAC system beyond `is_staff`
- Mobile/desktop apps
- A full security/performance audit (see project brief — that's a later phase)

These are deferred to later MVP modes / phases, per the project brief.

## Known limitation of this delivery

PostgreSQL itself could not be installed in the sandbox this backend was
built in (the OS package repo used for security updates was unreachable),
so automated tests and the manual API smoke test were run against the
sqlite3 fallback rather than a live Postgres instance. The Postgres
connection code path is written and passes Django's config checks, but
has not been exercised against a running Postgres server. Please run
`python manage.py migrate` against your real Postgres database as a
first step to confirm connectivity in your environment.

No lint/format tooling (flake8/black/ruff/etc.) is configured in this
project's `requirements.txt`, so a lint/format check was not part of the
verification for this delivery — see the final report for what was and
wasn't run.

