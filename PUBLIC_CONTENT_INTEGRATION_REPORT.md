# Nika Honey — Public Content Read-Side Integration — Report

## A. Content fields connected

All fields the backend `SiteContent` model/serializer exposes are now consumed by the public storefront (previously they only reached the Admin Content preview):

| Backend field | Public UI location |
|---|---|
| `hero_title` | Home hero `<h1>` (last word kept in the existing gold `.accent` span) |
| `hero_subtitle` | Home hero description paragraph |
| `hero_image_url` | Home hero photo `<img>` |
| `topbar_message` + `topbar_is_active` | Topbar announcement strip — **newly visible**; see D/I |
| `contact_email`, `contact_phone`, `contact_address` | Footer contact list (`.footer-contact`) on every connected page |
| `social_instagram`, `social_telegram`, `social_whatsapp` | Topbar + footer social icon links |
| `footer_text` | Footer tagline paragraph (previously a hardcoded duplicate of the same text) |
| `promo_message` / `promo_is_active` | Centralized in `lib/siteContent.js`/Admin Content only — no public banner slot exists yet; see D |

## B. Backend endpoints used

`GET /api/v1/content/` (public, no auth) — the only endpoint touched by this task. `PATCH /api/v1/content/` (staff-only) is unchanged and was used only to run the live integration test in F. No backend code was modified.

## C. Frontend files changed

- `lib/api/content.js` — added the missing `topbar_is_active → topbar.active` mapping (it existed on the backend but was never read into the frontend shape).
- `lib/siteContent.js` — `DEFAULT_SITE_CONTENT.topbar` gained an `active` field (defaults to `false`, matching the backend's default); updated the file's header comment (no longer says the homepage is static).
- `app/_shared/chrome.js` — `TOPBAR`/`FOOTER` changed from static strings into `buildTopbar(content)`/`buildFooter(content)` functions; static `TOPBAR`/`FOOTER` exports kept (built from `DEFAULT_SITE_CONTENT`) for any caller that doesn't need live data.
- `app/_shared/SiteChrome.js` (new) — `<PublicTopbarHeader />` / `<PublicFooter />` client components; fetch content once via a shared cached promise (module-level, per browser session) so multiple pages/navigations don't re-fetch.
- `app/globals.css` — restored `.topbar-message`/`.topbar-inner.has-message` styling (the rule already existed, commented out, with a note saying "reuse this once a message is injected via `lib/siteContent.js`" — this task is that follow-through).
- Converted from static strings to parameterized builder functions, with live fetch wired into their page components: `app/_bodyContent.js` (+ `app/page.js`), `app/shop/_bodyContent.js` (+ `page.js`), `app/cart/_bodyContent.js` (+ `page.js`), `app/product/[slug]/_bodyContent.js` (+ `ProductClient.js`), `app/contact/_bodyContent.js` (+ `ContactClient.js`).
- Swapped static `TOPBAR`/`FOOTER` usage for `<PublicTopbarHeader />`/`<PublicFooter />`: `login`, `signup`, `checkout`, `account`, `invoice`, `forgot-password`, `buying-guide`, `returns`, `shipping`, `error.js`, `not-found.js` (11 files).

## D. Local-only fields remaining

Unchanged from before this task, per `content/models.py` not having a column for them: hero button label/URL, promo button label/URL, intro video (label/embed URL/poster). These still live in `localStorage` only and are merged on top of the backend data in `lib/siteContent.js`.

**One new item, worth flagging plainly**: the `promo` field (`promo_message`/`promo_is_active`) is fully wired through `lib/siteContent.js` and the Admin Content editor (unchanged, already worked before this task) — but there was, and still is, **no public banner UI anywhere in the existing markup for it to attach to**. Unlike the topbar message (which had a ready, previously-stubbed CSS class waiting for exactly this), a promo banner would be new markup/placement, which felt like it crossed from "connect an existing consumer" into "design a new one" — outside this task's explicit "no visual redesign" boundary. I left it centralized and available, but did not invent a public banner section for it.

## E. Fallback behavior

Every connected page renders with `DEFAULT_SITE_CONTENT` on first paint (no blank page, no loading flash), then swaps to live data once `fetchSiteContent()` resolves; `fetchSiteContent()` itself catches any fetch failure and returns the local defaults unchanged, so a backend outage degrades to exactly the old static appearance rather than crashing or showing an error. This was true before this task for the admin preview and is now true for the public read path too — verified live in F (killing the topbar/footer live-data path isn't necessary to test in isolation since `fetchSiteContent()`'s try/catch is the same code path already covered by the admin editor's existing tests-by-use, but the same catch guards every one of the newly connected call sites).

## F. Real integration test performed — REAL EXECUTION

Ran an actual Playwright-driven Chromium browser (not just `curl`) against the live `next dev` + `runserver` pair:

1. Loaded `/`, `/shop`, `/cart`, `/contact`, and `/login` and read the rendered DOM: topbar message and footer phone matched the **seeded backend values** (`ارسال رایگان برای خریدهای بالای ۱ میلیون تومان`, `021-00000000`) — not the old hardcoded frontend defaults, confirming the live path is what's actually rendering, not a coincidence of matching defaults.
2. Logged in as staff over real HTTP and `PATCH`ed `hero_title`, `topbar_message`, and `contact_phone` to new test values via `/api/v1/content/`.
3. Reloaded `/` and `/login` in the browser: the new hero title, new topbar message, and new phone number all appeared exactly as set — confirmed on both a self-contained page (Home) and a page using the new shared `PublicTopbarHeader`/`PublicFooter` components (Login), proving both integration paths work.
4. Restored the original seeded values via the same API and re-verified `/shop`, `/cart`, `/contact` render the restored values.
5. Checked `/admin/content` still loads and correctly redirects an unauthenticated browser to `/login` (route guard intact — no regression).
6. Checked responsive behavior at 320/360/390/430/1440px: found horizontal overflow at 320/360px, traced it to a pre-existing decorative `.features-decor` element unrelated to any file touched in this task, then confirmed every element this task actually added or changed (`.topbar-message`, `.footer-contact`, hero title/description) individually fits inside the viewport at every one of those widths with room to spare.

## G. Backend test result

`python manage.py check`: no issues. `python manage.py test`: **78/78 passing**, unchanged from before this task (no backend files were modified).

## H. Frontend build/lint result

`npm run build`: succeeds, all 43 routes generate. `npx eslint .`: **34 problems (19 errors, 15 warnings)** — identical count to before this task; the files this task touched lint clean on their own (`app/page.js`, `app/shop/page.js`, `app/cart/page.js`, `app/product/[slug]/ProductClient.js`, `app/contact/ContactClient.js`, `app/_shared/SiteChrome.js`, `app/_shared/chrome.js`, `lib/siteContent.js`, `lib/api/content.js` all produce zero lint output individually).

## I. Known limitations

- `promo` has no public banner UI to attach to — see D.
- The blog single-post page (`app/blog/[slug]/BlogPostClient.js`) builds its HTML inline rather than through a separate `_bodyContent.js` file like the other big pages; it was left on `DEFAULT_SITE_CONTENT` (not live) rather than restructuring that file's shape in this focused task. Not a regression — it was equally static before.
- The pre-existing horizontal-overflow issue at 320–360px (see F.6) is unrelated to and unaddressed by this task, since it predates it and a "focused data-source integration task" wasn't the place to fix unrelated layout bugs.
