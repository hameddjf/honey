# Final Seed Data + Database Configuration Pass — Change Report

`seed_demo` is now the single comprehensive demo-data generator for
everything the app currently supports, and the database is fully
environment-driven for the Cloudflare + Render + Neon hosting target.

## Models added/changed

- **`content.SiteContent`** — added `video_label`, `video_embed_url`,
  `video_poster_image_url`. The intro video was previously a
  frontend-only `localStorage` field (explicitly flagged as a gap by
  this task) — it's now a real, persisted, staff-editable backend field
  like the rest of the storefront chrome.
- **`content.BlogPost`** — new minimal model (`title`, `slug`, `excerpt`,
  `body`, `cover_image_url`, `tag`, `author`, `is_published`,
  `published_at`). `body` is plain/lightweight-markdown text
  (`## heading` + paragraphs), not a separate block model — kept
  deliberately minimal since nothing yet needs structured blocks.
- **Field-type fix**: `SiteContent.hero_image_url`, the new
  `video_poster_image_url`, and `BlogPost.cover_image_url` are
  `CharField`, not `URLField`. Found this while wiring the video field:
  Django's `URLField` validator **rejects relative paths** like
  `/images/about-photo.jpg` — exactly the kind of value these fields
  hold by default. Left as `URLField`, the very first `PATCH /content/`
  that didn't touch the image fields would have failed with a 400. Fixed
  before it could ship, verified with a live PATCH against the seeded
  defaults.
- **`products.Product`** — no schema change; `seed_demo` now fills the
  existing `description` field (previously only `short_description` was
  seeded) and `previous_price` on the two featured products.

## Migrations

- `content/migrations/0002_blogpost_sitecontent_video_embed_url_and_more.py`
  — adds `BlogPost`, the three video fields, and the `hero_image_url`
  type fix, in one migration.
- No other app needed a migration this pass.
- `python manage.py makemigrations --check --dry-run` → clean.

## `seed_demo` coverage

Rewritten as one command with clearly separated sections, each reporting
what it created vs. what was already up to date:

| Section | What it does |
|---|---|
| Categories | 2 categories (unchanged from before) |
| Products | All 7, now with full `description`, `previous_price` on 2 of them, `size_value`/`size_unit` (from the prior pass) |
| **Product images** | **New.** 2 real `ProductImage` rows per product (primary + detail), generated locally with Pillow — a deterministic gradient + jar-silhouette placeholder, no network call, no external asset. Skips any product that already has an image (from an earlier seed run *or* a real staff upload) — seed_demo never overwrites real photos. |
| Users | Demo customer + demo staff (unchanged; no superuser seeded, matching the existing project convention) |
| Orders | 5 orders, one per workflow stage (pending→delivered). Line items are now **varied per order** (previously the same single line repeated 5×) and totals are computed by the real `recalculate_totals` service — never hand-entered |
| Site content | Hero, topbar, contact, socials, footer, promo, **and now the intro video** |
| Blog posts | **New.** 6 posts, ported verbatim (same slugs, titles, excerpts, content) from `frontend/lib/blog.js` — real editorial content, no lorem ipsum |
| Media library | **Deliberately skipped** — see "known limitation" below |

Idempotency verified directly (not just by reading the printed output):
ran `seed_demo` twice against a fresh DB and asserted exact row counts
stayed at 2 categories / 7 products / 14 images / 5 orders / 6 blog
posts / 1 content row both times. This is now also a permanent
automated test (`products/tests/test_seed_demo.py`), including a
specific test that a product with an existing image never gets a second
placeholder stacked on top of it.

## Blog implementation

- `content.BlogPost` model, `BlogPostSerializer`, a public
  `ReadOnlyModelViewSet` at `/api/v1/blog-posts/` and
  `/api/v1/blog-posts/{slug}/` (`AllowAny`, always scoped to
  `is_published=True` — no unpublished-post workflow exists yet, so
  there's nothing an authenticated request should see that an anonymous
  one shouldn't). Registered in Django admin for basic staff management
  without touching the Next.js Admin V2 UI.
- **The public blog pages still read `frontend/lib/blog.js` directly** —
  I did not rewire them to call this new API. The task's own wording
  ("implement... only if required to make seeded blog content actually
  usable") only required the model/API/seed to exist and be usable, not
  a frontend swap, and rewiring public pages would have pushed into
  "redesign the public website" territory the task explicitly excluded.
  The backend is now a real, ready source of truth for this content
  whenever that frontend switch is wanted.

## Video content

- Model/serializer/seed as above.
- **Frontend wiring**: `lib/api/content.js`'s `toBackendPayload`/
  `fromBackendPayload` now map `video.label`/`video.embedUrl`/
  `video.posterImage` to/from the three new backend fields, so
  `/admin/content`'s existing video form fields now actually persist via
  `PATCH /content/` instead of only ever writing to `localStorage`.
- Seeded with a real, freely-embeddable placeholder (Big Buck Bunny,
  Blender Foundation / Creative Commons) — a working video, not a fake
  file — clearly commented in `seed_demo.py` as a stand-in for the real
  intro video, to be replaced via `/admin/content` before production.

## Database behavior

Unchanged in logic, now explicitly matches the requested shape and is
documented that way in `.env.example`:
- `DATABASE_URL` unset → SQLite (`backend/db.sqlite3`) — local dev and
  this repo's test suite.
- `DATABASE_URL` set → that PostgreSQL database — the deployed-backend
  path, intended to point at Neon.
- Discrete `POSTGRES_*` vars remain as a documented (commented-out)
  fallback if `DATABASE_URL` isn't set, but `.env.example` now says
  plainly that `DATABASE_URL` is the one Neon actually gives you and is
  the preferred path — no inverted dev/prod strength, no MySQL, no
  provider SDK added (`dj-database-url` + `psycopg2-binary`, already
  present, are provider-agnostic).

## Environment variables

Root `.env` / `.env.example` — no keys added or removed this pass (the
full list was already established in the prior env-consolidation pass);
comments updated to name the concrete hosting target:
- `DJANGO_ALLOWED_HOSTS` comment → Render Web Service domain.
- `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS` comments → Cloudflare
  Pages origin.
- `DATABASE_URL` comment → Neon, with the connection-string shape shown
  for reference (not filled in — genuinely unknown until the Neon
  project exists).
- A short "intended production hosting target" note added near the top
  of `.env.example` (Cloudflare / Render / Neon) so it's discoverable at
  a glance.
- No real secrets filled in or exposed anywhere in this report or the
  files themselves.

## Tests

- `python manage.py check` — clean.
- `python manage.py makemigrations --check --dry-run` — no changes
  detected (migrations fully committed).
- `python manage.py test` — **124/124 passing** (114 from before + 10
  new: video-field + blog-API coverage in `content/tests`, and 4 in the
  new `products/tests/test_seed_demo.py`, one of which is the
  don't-duplicate-a-real-upload regression test).
- `seed_demo` run twice against a fresh SQLite database — verified
  byte-for-byte-stable row counts, both by reading the command's own
  output and by querying the DB directly afterward.

## Build result

`npm run build` — succeeded. All 43 routes generated, including the 6
static blog post pages and 7 static product pages.

## Known limitations / deliberate scope decisions

- **Media library (`/admin/media`) was not seeded.** There is no real
  backend `Media` model — the page's own UI already says so explicitly
  ("آپلود واقعی فایل هنوز به بک‌اند وصل نیست"). The task's own wording
  made this conditional ("if the project has a real media model"), so
  building an entire new Media subsystem here would have been scope
  creep beyond "seed data completion." Left as a clearly-flagged gap
  rather than silently built.
- **Blog is backend-real but not frontend-wired** — see "Blog
  implementation" above.
- Media/product images are stored on local disk (`MEDIA_ROOT`), which is
  ephemeral on most free/managed hosts — this is a deployment concern
  the task explicitly said not to touch in this pass, not a bug here.
- This pass does not perform any actual deployment (as instructed) —
  it only makes the project's configuration and seed data ready for it.
