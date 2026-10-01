# Product Model Fix + Images + Root `.env` — Change Report

Adds real package size (`size_value`/`size_unit`), a proper multi-image
`ProductImage` model, fixes an inventory race condition, and consolidates
all environment configuration into one canonical root `.env`. Admin V2 and
public visual design are unchanged.

## Root `.env` — one canonical file

A single `.env` (and `.env.example`) now lives at the **project root**,
read by both halves:

- `backend/config/settings/base.py` loads it via `load_dotenv(ROOT_DIR / ".env")`.
- `frontend/next.config.mjs` loads it via `dotenv.config({ path: "../.env" })`
  and explicitly forwards `NEXT_PUBLIC_API_URL` into the client bundle.
- `backend/.env.example` is kept only as a pointer ("superseded, see
  `../.env.example`") so anyone following muscle memory from the old
  `cd backend && cp .env.example .env` flow isn't misled.

**Known/filled values** (safe for local dev): `DJANGO_SETTINGS_MODULE`,
`DJANGO_SECRET_KEY` (dev placeholder), `DJANGO_DEBUG=true`,
`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS`
(localhost:3000), `DJANGO_LANGUAGE_CODE=fa`, `DJANGO_TIME_ZONE=Asia/Tehran`,
`DJANGO_EMAIL_BACKEND` (console backend by default), `EMAIL_HOST`/`EMAIL_PORT`/
`EMAIL_USE_TLS` (Gmail SMTP defaults), `DJANGO_SECURE_SSL_REDIRECT`,
`NEXT_PUBLIC_API_URL` (local Django dev server).

**Intentionally left blank** (unknown/deployment-specific — clearly
commented in `.env.example`): real production frontend URL, real production
backend URL (to add to `DJANGO_ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS`/
`CSRF_TRUSTED_ORIGINS`), `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`,
`DEFAULT_FROM_EMAIL`. No production secrets or URLs were invented.

**Database**: `DATABASE_URL` and the `POSTGRES_*` block are present in
`.env.example` but commented out / disabled — with nothing set, the backend
falls back to local SQLite automatically. PostgreSQL was not activated.

## 1. Product model

`Product` keeps `stock` (sellable-unit count) and adds, independently:
- `size_value` — `DecimalField`, optional, must be `> 0` when set.
- `size_unit` — `CharField` with choices `g, kg, ml, L, piece, pack, box, jar`.

Both are optional, but the serializer enforces "both or neither" — you
can't set one without the other.

## 2. Product images

New `ProductImage` model (`product`, `image`, `alt_text`, `sort_order`,
`is_primary`, `created_at`): many images per product, at most one primary
per product (DB-level partial unique constraint, not just app logic).
`Pillow` was already a dependency; `MEDIA_URL`/`MEDIA_ROOT` were already
configured.

## 3. API changes

`GET /products/` and `/products/{slug}/` now return `size_value`,
`size_unit`, and `images` (each `{id, url, alt_text, sort_order,
is_primary}`) — same shape for staff and public callers.

New staff-only nested actions on `ProductViewSet`:
| Method | Path | Behavior |
|---|---|---|
| POST | `/products/{slug}/images/` | Upload one image (multipart). First image on a product is always made primary automatically. Rejects >5MB or non-image files. |
| PATCH | `/products/{slug}/images/{id}/` | Edit `alt_text`/`sort_order`, or set `is_primary: true` (auto-unsets any other primary). |
| DELETE | `/products/{slug}/images/{id}/` | Deletes; if it was primary, the next image by `sort_order` is auto-promoted. |

## 4. Admin `/admin/products`

Form now includes قیمت قبلی، اندازه/وزن/حجم، واحد اندازه alongside the
existing fields, plus full image management: multi-upload, live preview
grid, choose primary (star), delete, and reorder. Reorder uses ‹ › buttons
that swap `sort_order` with the neighboring image (rather than
drag-and-drop) — a deliberate simplification that still gives staff full
control over image order without adding a DnD library.

## 5. Public frontend — Django as source of truth

`lib/products.js`'s `mergeCosmetic()` now takes `size_value`/`size_unit`
(formatted as `sizeLabel`, e.g. "۴۵۰ گرم") and real `images` from the API
as authoritative. The static `productsCosmetic.js` image is used **only**
as a fallback for a product that has no uploaded images yet — once staff
upload a real photo, it replaces the placeholder automatically. The
product detail page gallery and "وزن خالص" row, and the cart line tags,
read from this real data. Existing product slugs/routes are untouched
(`SLUG_BY_NAME` still maps the 7 original products to their stable
English URL slugs — that's routing, not business data).

Known minor leftover (not fixed, low-impact): the invoice page's
parenthetical weight annotation and the admin dashboard's demo-order
generator still read from the old cosmetic `weight` string. Both are
cosmetic-only display details in code paths that are otherwise
explicitly local demo/mock furniture (`lib/adminStore.js`'s
`seedDemoOrders`), not the real checkout/inventory path — real order
creation and stock are 100% server-authoritative regardless.

## 6. Validation

All server-side, in `ProductSerializer`: `size_value > 0` when provided;
valid `size_unit` choice; `size_value`/`size_unit` required together;
`stock >= 0`; `price >= 0`; `previous_price >= 0`; `previous_price` can't
be lower than the current `price` (checked correctly even on a partial
`PATCH` that only sends `previous_price`, against the product's existing
price). Image uploads: must be a real decodable image (Django `ImageField`
+ Pillow), max 5MB.

## 7. Order inventory race condition — fixed

`orders/services.py`'s `create_order` now locks every line's product row
with `select_for_update()` (inside the existing `@transaction.atomic`)
before checking/decrementing stock, so two simultaneous orders for the
last unit of a product can't both succeed. Locks are acquired in a fixed,
deterministic order (sorted `product_id`) so two concurrent orders sharing
products can never deadlock on each other. Pricing stays fully
server-computed, unchanged.

**A real bug I found and fixed along the way**: the model changes above
existed in `products/models.py`, but the corresponding migration was never
generated — `0001_initial.py` didn't have `size_value`/`size_unit`/
`ProductImage` at all, so `migrate`/`makemigrations` would have failed the
moment anyone ran them. Ran `python manage.py makemigrations products`,
producing `products/migrations/0002_product_size_unit_product_size_value_productimage.py`.

## 8. Migrations / seed data

- New migration: `products/0002_product_size_unit_product_size_value_productimage.py`.
- `seed_demo.py` updated: all 7 existing products now seed with realistic
  `size_value`/`size_unit` (450g for the six honey jars, 300g for the
  honey + royal jelly blend). Re-running `seed_demo` is still safe/idempotent.

## 9. Tests

Added to `products/tests/test_products.py`: 6 size/unit validation tests,
5 `previous_price` validation tests (including the partial-PATCH case),
and a full `ProductImageTests` class (10 tests: upload permissions,
auto-primary-on-first-image, second-image-not-primary, choosing primary,
delete-promotes-next-image, permission checks, public API shape, oversized
image rejection).

Added to `orders/tests/test_orders.py`: `OrderInventoryLockingTests`, a
genuine concurrency test using `TransactionTestCase` + two real threads
racing to buy the last unit of a stock=1 product — asserts exactly one
order succeeds, the other is rejected, and the product is never
oversold. (Note: SQLite has no true row-level `SELECT FOR UPDATE`, so this
test exercises the code path's *outcome* under SQLite's whole-database
write serialization rather than Postgres-style row locking specifically —
worth re-verifying under Postgres before any future move off SQLite.)

## 10. Test / build results

- `python manage.py check` — clean, 0 issues.
- `python manage.py migrate` — applies cleanly from scratch.
- `python manage.py test` — **114/114 passed** (full suite: the new
  products/orders tests plus every pre-existing suite — accounts, admin
  users, password reset, content — nothing broken).
- `npm run build` — **succeeded**, all 43 routes generated, and confirmed
  reading `NEXT_PUBLIC_API_URL` etc. from the root `.env`
  (`injected env (17) from ../.env` in the build log).

## Remaining limitations

- Reorder UI uses ‹ › swap buttons, not drag-and-drop (see §4).
- Invoice page and the admin dashboard's demo-order generator still show
  the old cosmetic weight string in one place each (see §5) — cosmetic
  display only, not the real product/checkout data path.
- No image resizing/thumbnailing — uploaded images are served as-is (5MB
  cap only). Fine for MVP; would want a resize step before scaling traffic.
- Media storage is local disk (`MEDIA_ROOT`) — on any platform with an
  ephemeral filesystem (e.g. Render's free tier), uploaded product images
  will be lost on redeploy/restart, same caveat as the SQLite database
  itself. Needs persistent disk or object storage (S3-compatible) before
  a production deploy on such a platform.
- The SQLite-vs-Postgres row-locking caveat noted in §9.
