# Nika Honey — Final Pre-Deployment Closure Report

Covers the 12 items in the final functional + SEO closure brief. The public
site and approved Admin V2 were not redesigned; no Docker/Redis/Celery/
object storage was added; nothing was deployed.

## 1. Real invoice

- No separate `Invoice` model was added — `Order` + `OrderItem` already
  snapshot everything an invoice needs (product name, unit price, quantity,
  line total, shipping, grand total), so a model would only duplicate data
  that can drift out of sync. Instead, `Order.invoice_number` is a computed
  property (`NK-` + the first 8 hex chars of the order's own UUID) — stable,
  unique, human-readable.
- New `Order.customer_name` field, captured at checkout, so the invoice can
  show a real "گیرنده سفارش" name (previously only derivable from email).
- `GET /api/v1/orders/by-number/{order_number}/` is the invoice's data
  source — **owner-scoped**: a registered user's order requires that same
  account (or staff) to be signed in; a guest order (no account) is
  readable by anyone holding the exact order_number — the same "private
  link" trust model any guest-checkout confirmation flow uses, since that
  UUID is unguessable and only ever given to the customer who placed the
  order. Never lists/searches — exact-UUID lookup only.
- Frontend: `/invoice/[orderNumber]` (new route) fetches this endpoint
  directly — survives refresh and works from a different device/browser,
  since nothing is read from localStorage. Checkout now redirects here on
  success; the account order-history page links here too. The bare
  `/invoice` route (no order number) is now a simple "which order?" landing
  page instead of a localStorage reader.
- Printable via the browser's native print (a "چاپ فاکتور" button calls
  `window.print()`). A real PDF-generation pipeline was **not** added — it
  would need either a headless-browser service or a new PDF-building
  dependency, a meaningfully heavier addition than this pass's scope
  justifies; browser print is a complete, working fallback as the brief
  allows ("If PDF generation is too large for this pass, keep browser
  print as fallback").
- Financial values are never trusted from the client: `subtotal`,
  `shipping_cost`, and `total` are always read from the `Order` row as
  computed by `orders/services.py` at creation time; nothing in the invoice
  flow accepts a client-supplied amount.

## 2. Payment state

- `Order.payment_method` is now a real choice field (`online` / `cod`),
  submitted from checkout. `Order.payment_reference` and `Order.paid_at`
  were added.
- **Selecting "online" at checkout never marks an order paid.**
  `orders.services.create_order` always leaves a new order at its model
  default (`payment_status="unpaid"`), regardless of `payment_method`.
  Verified live: created an order with `payment_method=online` →
  `payment_status` came back `"unpaid"`.
- The only place `payment_status` can change is the new staff-only
  `orders.services.mark_payment()`, exposed as `PATCH
  /api/v1/orders/{id}/payment/`. It stamps `paid_at` the first (and only
  the first) time an order moves into `paid`. Verified live: a non-staff
  user hitting this endpoint gets `403`.
- No real bank gateway was integrated (none was selected/credentialed, per
  the brief's own condition). `backend/orders/payments.py` is a documented
  extension point: a stub `initiate_payment()` that raises
  `NotImplementedError` with exact instructions for what a real
  integration should do, including that a client redirect is never
  sufficient proof of payment — only a server-verified gateway callback is.

## 3. Shipping

- New singleton `content.StoreSettings` model owns shipping configuration:
  `shipping_enabled`, `shipping_flat_cost`, `free_shipping_threshold`.
  `GET /api/v1/settings/` is public (checkout needs it unauthenticated);
  `PATCH` is staff-only.
- `StoreSettings.compute_shipping_cost(subtotal)` is the one function that
  turns settings + a subtotal into a cost — used both by
  `orders.services.create_order` (authoritative, at order-creation time)
  and available to the frontend's up-front estimate via the same settings
  endpoint, so the two can never disagree.
- Checkout displays the estimate live (`estimateShipping()` in
  `lib/api/storeSettings.js`, fed by `GET /settings/`), but the backend
  always recomputes `shipping_cost` itself when the order is actually
  created — verified live: with `free_shipping_threshold=1,500,000` and an
  order subtotal of `1,780,000`, the created order's `shipping_cost` came
  back `"0.00"` correctly.
- No courier-provider integration, as scoped.

## 4. Admin dashboard — real data

- New staff-only `GET /api/v1/admin/dashboard/`
  (`orders/analytics.py::AdminDashboardView`) returns real aggregated
  totals (orders, revenue, customers, products), an order-status
  breakdown, low-stock products (from `StoreSettings.low_stock_threshold`),
  and top products by quantity sold — all computed server-side with
  `Sum`/`Count` aggregation, not shipped as raw rows for the browser to
  crunch.
- `AdminDashboardClient.js` rewritten off `adminStore`/localStorage onto
  this endpoint (plus the existing real `/orders/` list for the "سفارش‌های
  اخیر" table, and `/admin/reports/` for the trend chart). Same
  stat-card/chart/table components as before — no UI redesign.
- Verified live against real seeded data (5 orders): dashboard returned
  correct revenue (5,380,000), status counts, and top-5 products by
  quantity.

## 5. Admin reports — real data

- New staff-only `GET /api/v1/admin/reports/?from=&to=`
  (`AdminReportsView`) computes, for the given date range: total revenue,
  order count, average order value, delivered/cancelled rates, a daily
  sales trend (`TruncDate` + `Sum`/`Count`), and sales-by-product — all
  authoritative, server-computed.
- `AdminReportsClient.js` rewritten onto this endpoint with a date-range
  picker (7/14/30 days); existing `LineChart`/`BarChart`/`Table` components
  reused as-is.

## 6. Admin settings

- `StoreSettings` (see item 3) also carries `guest_checkout_enabled`,
  `maintenance_mode`, `low_stock_threshold`, `notify_new_order`,
  `notify_low_stock` — exactly the items the brief names as the minimum.
  Staff-only write (`PATCH /api/v1/settings/`), public read.
- `AdminSettingsClient.js` now loads/saves these five areas against the
  real API. The "اطلاعات فروشگاه" (store name/owner/email/phone/address)
  section was deliberately **left on local state** rather than given a new
  backend field: those same fields are already the real, backend-persisted
  `SiteContent` contact fields edited on `/admin/content` — duplicating
  them into `StoreSettings` would be exactly the "unnecessary settings
  field" the brief says not to create. A "weekly summary" notification
  toggle that existed only in the old local mock UI was dropped for the
  same reason — it wasn't part of the scoped minimum and had no real
  effect to back it.
- Verified live: guest checkout toggled off → a subsequent guest order
  attempt correctly returned `400` ("Guest checkout is currently
  disabled...").

## 7. Customer address book

- New `accounts.Address` model + owner-scoped `AddressViewSet`
  (`accounts/addresses.py`) at `/api/v1/addresses/`: list/create/
  edit/delete, all filtered to `request.user` — there is no way to see or
  modify another user's addresses through this endpoint. The first address
  a user saves becomes their default automatically; deleting the current
  default promotes the next most-recent one.
- "Set default" is a `PATCH` with `is_default: true` (standard REST, no
  extra endpoint needed) — wired up in the Account page's address list as
  a "تنظیم به‌عنوان پیش‌فرض" button.
- `AccountClient.js`'s address tab rewritten off localStorage onto this
  API (loading/error states included). Checkout can now select a saved
  address to prefill the shipping fields (still editable after).
- Guests never get an address book (no `user` to own one) — matches the
  brief exactly.

## 8. SEO — final pass

- **Site-wide metadata** (`app/layout.js`): title template (`%s | عسل
  طبیعی نیکا`), `metadataBase` from `NEXT_PUBLIC_SITE_URL`, default
  OpenGraph/Twitter tags, `fa_IR` locale, default `robots: {index:true,
  follow:true}`, favicon declared explicitly. Fixed a title-template bug
  introduced by this change: ~17 existing page titles had the site name
  hardcoded into the string already (`"X | عسل طبیعی نیکا"`), which would
  have doubled up once the template started appending it automatically —
  stripped back to just the page-specific portion everywhere.
- **robots.txt** (`app/robots.js`): public pages allowed; `/admin`,
  `/account`, `/checkout`, `/invoice`, `/cart`, `/login`, `/signup`,
  `/forgot-password` disallowed. Points to the real sitemap URL.
- **sitemap.xml** (`app/sitemap.js`, `export const dynamic =
  "force-dynamic"` so it's computed per-request, never at build time):
  home, shop, blog index, static pages (about/contact/faq/shipping/
  returns/buying-guide), every product page (from the offline cosmetic
  catalog — always available), and every *published* blog post (fetched
  live from Django via the same `fetchBlogPosts()` used by the public blog
  pages, with the same local fallback on failure). Verified live, with and
  without the backend running — both produce a complete, valid sitemap.
- **Product SEO**: each product page now has a canonical URL, dynamic
  title/description, OpenGraph/Twitter tags, and `Product` JSON-LD (name,
  description, image, brand, offer price, availability). No ratings/
  reviews are fabricated — there's no real review data in this project so
  none is claimed. This metadata is built from the offline cosmetic
  catalog (not a live fetch), because these routes are statically
  generated at *build* time (`generateStaticParams`) — a live backend call
  here would make the Cloudflare build depend on the Django server being
  reachable, which the brief explicitly rules out. The visible page content
  (live price/stock) is still refreshed client-side as before; only the
  meta/JSON-LD price can lag until the next deploy if a price changes in
  between — documented here as a known, intentional trade-off.
- **Blog SEO**: each post page has a canonical URL, OpenGraph `article`
  metadata, and `BlogPosting` JSON-LD (headline, description, image,
  author, published date where available). Same build-time-safety
  reasoning as products: built from the local fallback blog data (already
  used for `generateStaticParams`), not a live fetch.
- **Organization / WebSite schema**: added to the root layout — real
  project facts only (site name, canonical URL). No address, phone, or
  rating was fabricated; a `sameAs` social-profile link can be added once a
  real one is confirmed (the current `SiteContent` defaults for
  Instagram/Telegram/WhatsApp are placeholder `#` links, not real URLs, so
  nothing was invented there).
- **BreadcrumbList schema**: added to both product and blog detail pages,
  built from the same crumb arrays already used for the visible breadcrumb
  UI (`pageHero()`), so there's no separate source of truth to drift.
- **Home / Shop SSR** — this is the one sub-item **not** fully addressed.
  The home and shop pages' product/category grids are built entirely
  client-side today: the server-rendered HTML ships an empty container,
  and a `<script>` (`_bodyScript.js`) fills it in from
  `window.__NIKA_PRODUCTS__` after the client-side fetch resolves — so a
  crawler that doesn't execute JavaScript sees no product cards on those
  two pages specifically. Porting that DOM-injection logic into a
  server-rendered HTML string (so the *same* markup ships pre-populated,
  with the client script enhancing rather than building it) is a real,
  identifiable piece of work, but doing it hastily risked visual/behavioral
  regressions on the two highest-traffic public pages, which the brief
  explicitly protects ("do not rewrite the visual architecture
  unnecessarily"). What *is* covered: both pages have full metadata/OG
  tags, the shop route was split out of its former client-only `page.js`
  specifically so it could carry real `<head>` metadata, and — critically
  — every individual product page (where a shopper or crawler actually
  lands from a search result) is properly SEO'd per above, including in
  the sitemap. Left explicitly as a follow-up: server-render the product
  grid markup for `/` and `/shop` using the same data shape the client
  script already expects, so no visual changes are needed on the client
  side, only where the initial HTML comes from.

## 9. SEO environment

- `NEXT_PUBLIC_SITE_URL` is the single source for the canonical URL
  (`lib/seo.js`), used by `metadataBase`, all canonical/OpenGraph URLs,
  `robots.txt`'s `Host`/`Sitemap` lines, and every `sitemap.xml` entry.
  Defaults to `http://localhost:3000` for local dev when unset. Documented
  in `.env.example` with a clear note that the real production domain must
  be set as a platform environment variable (e.g. in Cloudflare Pages),
  never hardcoded. Verified live: building with
  `NEXT_PUBLIC_SITE_URL=https://nikahoney.example.com` produced a correctly
  domained `robots.txt` and `sitemap.xml`.

## 10. Regression safety

All run against this final zip, from a clean state:

```
python manage.py check                          -> System check identified no issues (0 silenced)
python manage.py makemigrations --check --dry-run -> No changes detected
python manage.py migrate                         -> applies cleanly on fresh SQLite
python manage.py test                            -> Ran 169 tests - OK
python manage.py seed_demo   (run twice)          -> run 2: every line "already up to date"; counts
                                                      stable (7 products, 5 orders, 6 blog posts,
                                                      6 media assets, 1 demo address, 1 settings row)
npm run build                                     -> succeeds (Django server not running during build)
```

Routes checked (build output + live manual checks): `/`, `/shop`,
`/product/*`, `/blog`, `/blog/*`, `/checkout`, `/invoice`, `/invoice/
[orderNumber]`, `/account`, `/admin`, `/admin/orders`, `/admin/products`,
`/admin/customers`, `/admin/content`, `/admin/media`, `/admin/users`,
`/admin/reports`, `/admin/settings` — all present in the build output with
the expected static/dynamic rendering mode; the `/admin/dashboard` and
`/admin/reports` endpoints and the full checkout -> invoice flow were also
exercised live end-to-end (see items 1-7 above for specifics).

## 11. Gmail SMTP

Already correct from an earlier pass — reviewed, not changed:
`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`/`EMAIL_HOST`/`EMAIL_PORT`/
`EMAIL_USE_TLS`/`DEFAULT_FROM_EMAIL` are all environment-driven with no
hardcoded credentials anywhere. `EMAIL_BACKEND` automatically resolves to
the real SMTP backend whenever `EMAIL_HOST_USER` is set, and only falls
back to Django's console backend when it isn't (e.g. a fresh local
checkout with no `.env`) — so production, once `EMAIL_HOST_USER` is
configured, never silently falls back to console email.
`DJANGO_EMAIL_BACKEND` remains available to force either backend
explicitly if ever needed.

## 12. Remaining limitations (left for a later phase)

- **Home/shop product-grid SSR** — see item 8's last paragraph. Everything
  else in the SEO pass is complete; this one piece is identified, scoped,
  and intentionally deferred rather than rushed.
- **No real payment gateway** — by design, per the brief's own condition;
  `orders/payments.py` is the documented landing point for one.
- **No PDF invoice generation** — browser print is the working fallback; a
  real PDF pipeline would need a new dependency/service this pass didn't
  add.
- **Media files still serve from local `MEDIA_ROOT`** (unchanged from the
  previous pass) — Render's free tier has an ephemeral filesystem, so real
  production media persistence will need object storage or a Render disk
  in a later infrastructure phase; this pass was explicitly told not to
  add object storage.
- **Notification toggles have no delivery channel wired up** — they're
  real, staff-editable, persisted flags (`notify_new_order`,
  `notify_low_stock`), but nothing currently sends an email/SMS when they
  fire; wiring them to the existing SMTP configuration is straightforward
  follow-up work once desired.
- Product/blog JSON-LD and OpenGraph data reflect the catalog/content as
  of the last deploy (not a live read) for the build-time-safety reasons
  explained in item 8 — acceptable since the visible page content is still
  live, and re-deploying refreshes it.

The project is ready for the next step (Cloudflare Pages + Render Free +
Neon PostgreSQL), with local development unchanged (SQLite, `DEBUG=true`)
and all of the above verified against a real, seeded local backend.
