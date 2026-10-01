# Nika Honey API — Reference (MVP Mode 2)

Base path: `http://localhost:8000/api/v1/`

All request/response bodies are JSON. Authentication is JWT (SimpleJWT)
via `Authorization: Bearer <access_token>`, except where noted.

Legend for **AUTH REQUIRED**: `none` / `customer` (any authenticated
user) / `staff` (`is_staff=True`).

---

## 1. Authentication — `/accounts/`

### `POST /accounts/register/`
- **AUTH REQUIRED:** none
- **PERMISSION:** AllowAny
- **REQUEST BODY:**
  ```json
  { "email": "a@example.com", "password": "strong-pass-123", "full_name": "Ada", "phone_number": "0912..." }
  ```
- **RESPONSE (201):** the created user, without the password.
- **COMMON ERRORS:** 400 duplicate email, 400 weak password (Django validators).

### `POST /accounts/login/`
- **AUTH REQUIRED:** none
- **REQUEST BODY:** `{ "email": "...", "password": "..." }`
- **RESPONSE (200):** `{ "access": "...", "refresh": "..." }`
- **COMMON ERRORS:** 401 invalid credentials.

### `POST /accounts/login/refresh/`
- **AUTH REQUIRED:** none (valid refresh token in body)
- **REQUEST BODY:** `{ "refresh": "..." }`
- **RESPONSE (200):** `{ "access": "...", "refresh": "..." }` (rotated)
- **COMMON ERRORS:** 401 invalid/blacklisted/expired refresh token.

### `POST /accounts/logout/`
- **AUTH REQUIRED:** customer
- **REQUEST BODY:** `{ "refresh": "..." }`
- **RESPONSE:** 205, empty body. Blacklists the refresh token.
- **COMMON ERRORS:** 400 missing/invalid token.

### `GET /accounts/me/`
- **AUTH REQUIRED:** customer
- **RESPONSE (200):** `{ id, email, full_name, phone_number, is_staff, created_at }`

### `PATCH /accounts/me/`
- **AUTH REQUIRED:** customer
- **REQUEST BODY:** any of `{ "full_name", "phone_number" }`. `email`,
  `is_staff`, `is_superuser`, ids etc. are never accepted — they simply
  aren't part of this schema, no matter what the request body contains.
- **RESPONSE (200):** updated profile (same shape as GET).

### `POST /accounts/me/change-password/`
- **AUTH REQUIRED:** customer
- **REQUEST BODY:** `{ "old_password": "...", "new_password": "..." }`
- **RESPONSE (200):** `{ "detail": "Password updated." }`
- **COMMON ERRORS:** 400 wrong old password, 400 new password fails
  Django's validators (too short/common/numeric-only/similar-to-user-info).

---

## 2. Customers (staff only) — `/customers/`

### `GET /customers/`
- **AUTH REQUIRED:** staff
- **PERMISSION:** `IsStaffUser`
- Supports `?search=`, `?is_active=`, `?ordering=created_at|email|order_count`,
  and pagination (`?page=`).
- **RESPONSE (200):** paginated list of
  `{ id, email, full_name, phone_number, is_active, created_at, order_count }`.
  Staff accounts are excluded from this list.

### `GET /customers/{id}/`
- **AUTH REQUIRED:** staff
- **RESPONSE (200):** same fields plus `recent_orders` (full order objects,
  see §4).
- **COMMON ERRORS:** 404 unknown id, 403 non-staff caller.

---

## 3. Products & categories — `/products/`, `/categories/`

### `GET /categories/`
- **AUTH REQUIRED:** none (read); staff (write)
- **RESPONSE:** paginated list of `{ id, name, slug, description, is_active, product_count }`.
  Anonymous/customer callers only see `is_active=true` categories.

### `POST /categories/`
- **AUTH REQUIRED:** staff
- **REQUEST BODY:** `{ "name", "description"?, "is_active"? }`

### `GET / PATCH / DELETE /categories/{slug}/`
- **AUTH REQUIRED:** none (GET) / staff (PATCH, DELETE)

### `GET /products/`
- **AUTH REQUIRED:** none (read); staff (write)
- Filters: `?category__slug=`, `?is_active=`, `?is_featured=`,
  `?price_min=`, `?price_max=`, `?in_stock=true|false`
- Search: `?search=` (name, short_description, description)
- Ordering: `?ordering=price|-price|created_at|name|stock`
- Anonymous/customer callers only see `is_active=true` products.
- **RESPONSE:** paginated list of
  `{ id, name, slug, category, short_description, description, price, previous_price, stock, is_active, is_featured, is_in_stock, created_at, updated_at }`.

### `POST /products/`
- **AUTH REQUIRED:** staff
- **REQUEST BODY:** `{ "name", "category" (slug), "price", "stock", "short_description"?, "description"?, "is_active"?, "is_featured"?, "previous_price"? }`
- **COMMON ERRORS:** 400 negative price/stock, 400 unknown category slug.

### `GET / PATCH / DELETE /products/{slug}/`
- **AUTH REQUIRED:** none (GET) / staff (PATCH, DELETE)
- PATCH supports partial updates: price changes, stock changes,
  activate/deactivate (`is_active`), feature/unfeature (`is_featured`),
  re-categorize, edit description, etc.

---

## 4. Orders — `/orders/`

Order pricing is **always** computed server-side from live `Product`
records; any `price`/`total` sent by the client is ignored.

### `POST /orders/`
- **AUTH REQUIRED:** none (guest checkout allowed)
- **REQUEST BODY:**
  ```json
  {
    "guest_email": "guest@example.com",
    "shipping_address": "Tehran, ...",
    "contact_phone": "0912...",
    "items": [{ "product_id": 1, "quantity": 2 }]
  }
  ```
  `guest_email` is required only if the caller is not authenticated.
- **RESPONSE (201):** the created order (see shape below).
- **COMMON ERRORS:** 400 empty items, 400 unknown/inactive product,
  400 insufficient stock, 400 neither user nor guest_email.

### `GET /orders/`
- **AUTH REQUIRED:** customer (own orders) / staff (all orders)
- Filters: `?status=`, `?payment_status=`, `?created_after=`, `?created_before=`
- Search (staff): `?search=` (guest_email, user email, user full_name)
- Ordering: `?ordering=created_at|-created_at|total|status`
- **RESPONSE:** paginated list of order objects:
  ```json
  {
    "id": 1, "order_number": "uuid", "status": "pending",
    "payment_status": "unpaid", "payment_method": "",
    "user": 3, "guest_email": "", "customer_email": "a@example.com",
    "shipping_address": "...", "contact_phone": "...",
    "subtotal": "450000.00", "shipping_cost": "0.00", "total": "450000.00",
    "items": [{ "id": 1, "product": 1, "product_name": "...", "unit_price": "450000.00", "quantity": 1, "line_total": "450000.00" }],
    "created_at": "...", "updated_at": "..."
  }
  ```

### `GET /orders/{id}/`
- **AUTH REQUIRED:** owner or staff
- **COMMON ERRORS:** 403/404 for another customer's order.

### `PATCH /orders/{id}/status/`
- **AUTH REQUIRED:** staff
- **REQUEST BODY:** `{ "status": "confirmed" }`
- Allowed transitions (see `orders/services.py`):
  `pending → confirmed | cancelled`
  `confirmed → preparing | cancelled`
  `preparing → shipped | cancelled`
  `shipped → delivered`
  `delivered` / `cancelled` are terminal.
- **RESPONSE (200):** updated order.
- **COMMON ERRORS:** 400 invalid/out-of-order transition, 403 non-staff caller.

---

## 5. Storefront content — `/content/`

A single, flexible record (hero, topbar, contact info, socials, footer,
promo banner) — not a full CMS.

### `GET /content/`
- **AUTH REQUIRED:** none
- **RESPONSE (200):**
  ```json
  {
    "hero_title": "...", "hero_subtitle": "...", "hero_image_url": "",
    "topbar_message": "...", "topbar_is_active": true,
    "contact_email": "...", "contact_phone": "...", "contact_address": "...",
    "social_instagram": "", "social_telegram": "", "social_whatsapp": "",
    "footer_text": "...", "promo_message": "...", "promo_is_active": true,
    "updated_at": "..."
  }
  ```

### `PATCH` / `PUT /content/`
- **AUTH REQUIRED:** staff
- **REQUEST BODY:** any subset (PATCH) or full set (PUT) of the fields above.
- **COMMON ERRORS:** 403 non-staff caller.

---

## 6. Misc

### `GET /health/`
- **AUTH REQUIRED:** none — liveness check, `{ "status": "ok", "time": "..." }`

### `/admin/`
Django Admin (not under `/api/v1/`), for internal backend management —
not a customer- or frontend-admin-facing surface.

---

## Error shape

DRF's default error format is used throughout: field-level validation
errors return `{ "field_name": ["message"] }` with status 400; permission
failures return `{ "detail": "..." }` with 401/403; not-found returns
`{ "detail": "Not found." }` with 404. No stack traces, secrets, tokens,
or database internals are ever included in error bodies.
