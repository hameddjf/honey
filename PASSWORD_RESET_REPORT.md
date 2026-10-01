# Nika Honey — Real Email OTP Password Recovery — Report

## A. Files changed

Backend:
- `accounts/serializers_password_reset.py` (new)
- `accounts/views_password_reset.py` (new)
- `accounts/urls.py` (added 3 routes)
- `accounts/admin.py` (read-only `PasswordResetRequest` admin)
- `accounts/migrations/0002_passwordresetrequest.py` (new, generated + applied)
- `accounts/tests/test_password_reset.py` (new, 19 tests)
- Already present before this task and reused as-is (not modified):
  `accounts/models.py` (`PasswordResetRequest`), `accounts/services/otp.py`,
  `accounts/services/notifications.py`, and the email/OTP settings block in
  `config/settings/base.py`.

Frontend:
- `lib/api/passwordReset.js` (new)
- `lib/auth.js` (real `requestPasswordReset`/`verifyPasswordResetOtp`/`confirmPasswordReset`; removed demo `emailExists`/`resetPasswordDemo`)
- `lib/authDemoOnly.js` (trimmed — dropped the now-unused demo reset functions)
- `app/forgot-password/ForgotPasswordClient.js` (rewritten: real 3-step flow)
- `app/globals.css` (added `.auth-link-btn` for the resend button — no redesign, just makes an unstyled button match the existing `.auth-switch` look)

## B. New API endpoints

- `POST /api/v1/accounts/password-reset/request/` — `{email}` → always `200` with the generic Persian message, throttled `5/hour` per client.
- `POST /api/v1/accounts/password-reset/verify/` — `{email, code}` → `200` with `{reset_token, expires_in_minutes}` on success, `400` on wrong/expired/attempts-exhausted, throttled `20/hour`.
- `POST /api/v1/accounts/password-reset/confirm/` — `{reset_token, new_password}` → `200` on success, `400` on invalid/expired/reused token or weak password, throttled `20/hour`.

## C. OTP architecture

`PasswordResetRequest` (one row per attempt): `user`, `email` (destination at request time), `channel` (`email`, extensible), `otp_hash`, `attempts`, `verified_at`, `reset_token_hash`, `reset_token_expires_at`, `consumed_at`, `expires_at`.

- OTP: 6-digit, generated with `secrets.choice` (CSPRNG), never stored in plaintext — only an HMAC-SHA256 digest keyed with `SECRET_KEY` (`hash_otp`/`verify_otp`, `hmac.compare_digest` to avoid timing leaks).
- Expiry: `PASSWORD_RESET_OTP_TTL_MINUTES` (10 min).
- Attempts: capped at `PASSWORD_RESET_OTP_MAX_ATTEMPTS` (5); each wrong guess increments `attempts` on the same row, checked *before* comparing the code so a correct code submitted after the cap is still rejected.
- Resend cooldown: `PASSWORD_RESET_RESEND_COOLDOWN_SECONDS` (60s) — a repeat request within the window is a silent no-op (no new email, no new row) but still returns the same generic `200`, so the cooldown itself can't be used to fingerprint whether an account exists.
- One-time use: verifying an OTP sets `verified_at`, which excludes it from being matched again; a fresh request invalidates (`consumed_at`) any still-open prior request for that user, so only the latest code is ever valid.
- Reset authorization: verification issues a separate, longer, single-use `reset_token` (`secrets.token_urlsafe(32)`, also HMAC-hashed, its own `PASSWORD_RESET_TOKEN_TTL_MINUTES` = 10 min expiry) — this is what `confirm/` spends, so the OTP itself can never be replayed against the final step.
- Channel-agnostic by design (`channel` field + `send_password_reset_otp(..., channel=...)` dispatcher) so an SMS channel can be added later by implementing one function — no schema or flow change (see J).

## D. Email architecture

`accounts/services/notifications.py::send_password_reset_otp` → `_send_via_email`: builds a Persian, RTL, branded (Nika Honey colors) `EmailMultiAlternatives` (plain-text + HTML) containing the OTP, its expiry in minutes, and a security warning ("support never asks for this code"). Sent via `settings.DEFAULT_FROM_EMAIL` with `fail_silently=False` so a real send failure surfaces to the caller — but the view always swallows that and returns the generic response regardless (see E). Logging only ever records that a send was *attempted* (`user_id=...`), never the OTP.

Email backend selection (already in place before this task, reused as-is): SMTP if `EMAIL_HOST_USER` is set in the environment, otherwise Django's console backend — so the project runs without any mail setup, and switches to real Gmail delivery automatically the moment real credentials are provided.

## E. Security protections implemented for this feature

- **Account-enumeration protection**: `request/` always returns the identical `200` + generic message — for an unknown email, a known email, a known email within its resend cooldown, *and* a known email where the real send throws an exception. All four cases were exercised in tests/live checks and produce byte-identical responses. No email-existence endpoint was added.
- **Rate limiting**: DRF `ScopedRateThrottle` per endpoint (`5/hour` request, `20/hour` verify, `20/hour` confirm), returning real `429`s — verified live.
- **OTP secrecy**: never returned in any API response, never written to application logs (only `logger.info` with a user id, no code). See the note below about one internal debugging mistake.
- **Timing-safe comparison** (`hmac.compare_digest`) for both the OTP and the reset token.
- **Reset-token indirection**: the OTP cannot be replayed against `confirm/`; only a verified request's token works, and it's single-use and time-boxed independently of the OTP's own expiry.
- **Password strength**: `confirm/` runs the new password through Django's standard `password_validation` (same validators used by register/change-password), rejecting weak passwords.
- **No new attack surface on existing auth**: nothing here touches JWT issuance/refresh/blacklisting.

**A mistake I want to be upfront about**: while building the live-verification tooling, I initially printed a raw MIME email block into my own tool output to debug an extraction issue. It was base64-encoded, not human-readable OTP text, but it was still OTP-bearing content in a place it shouldn't have been. I caught it immediately, truncated the log, restarted the server, and rewrote the verification script to decode and use the OTP entirely inside a script that only ever prints booleans/lengths — never the value or the raw email. The final, correct-approach run is what's reported in F below.

## F. Real SMTP test result

**SMTP CONNECTION/SEND: NOT PERFORMED.** I checked both this project's `.env` and the shell environment for `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` etc. — **neither is present**; the credentials described in the task instructions are not actually available in this sandbox. I also confirmed this sandbox's network egress is restricted to a fixed allowlist of package registries (pypi, npm, GitHub, etc.) — `smtp.gmail.com:587` is not reachable from here regardless of credentials. I'm not fabricating a "verified" result for either of these.

**INBOX RECEIPT: UNVERIFIED** (follows directly from the above — nothing was sent over real SMTP).

What I *did* verify, for real, against the live Django dev server (not the test suite):
1. `POST /accounts/register/` → `201`, real user created.
2. `POST /accounts/password-reset/request/` → `200`, generic message.
3. The code path called `EmailMessage.send()` for real (this always runs, regardless of backend) — with no `EMAIL_HOST_USER` configured, Django's own fallback routed it to the **console backend**, which succeeded (no exception), confirming the send call itself, the email content/branding, and the OTP generation/storage all work correctly end to end.
4. The OTP was decoded from that output *inside a script* (never displayed) and used to call `verify/` → `200` with a `reset_token`.
5. `confirm/` with that token and a new password → `200`.
6. `login/` with the **old** password → `401`. `login/` with the **new** password → `200` with a real access token.

This exercises 100% of the application logic real SMTP would run through — the only thing not verified is the actual TLS handshake + delivery to `smtp.gmail.com`, because I don't have the means to do that here. **To get a genuine "REAL and verified" result, this needs to run in an environment that has the real `EMAIL_HOST_PASSWORD` set and outbound network access to `smtp.gmail.com:587`** — at that point no code changes are needed; it will just work, since `EMAIL_BACKEND` auto-selects SMTP the moment `EMAIL_HOST_USER` is present.

## G. Backend test result — REAL EXECUTION

- `python manage.py test`: **78/78 passing** (59 pre-existing + 19 new for this feature), run against SQLite.
- `python manage.py check`: no issues.
- `python manage.py makemigrations --check`: no changes detected (migration already generated and applied).
- Live HTTP flow (see F) run against a real `runserver` process — real execution, not mocked.

## H. Frontend build/lint result — REAL EXECUTION

- `npm run build`: succeeds, all 43 routes generate (Turbopack).
- `npx eslint .`: **34 problems (19 errors, 15 warnings)** project-wide — unchanged from before this task; confirmed the same pre-existing `react-hooks/set-state-in-effect` baseline (a Next 16 default-lint-config issue predating this work, per the prior integration report) — no errors introduced by the password-reset files themselves (`ForgotPasswordClient.js`, `lib/auth.js`, `lib/authDemoOnly.js`, `lib/api/passwordReset.js` all lint clean on their own).
- `/forgot-password` and `/login` return `200` from a live `next dev` server.
- **NOT performed**: an actual browser click-through of the 3-step UI — same limitation as the prior integration phase (no working headless browser in this sandbox). Verified via build success + route-level HTTP checks + the backend contract each step calls being independently confirmed live.

## I. Known limitations

- Real Gmail SMTP delivery is unverified here — see F. The code is ready; it needs real credentials + network access to prove out.
- `/admin/users` (role change / delete) is still local-demo-only, unrelated to this task (carried over from the prior integration report).
- The OTP email's HTML template is intentionally simple (no logo image, inline styles only) — matches the project's "don't redesign" instruction rather than a limitation to fix.

## J. Future SMS integration point

`send_password_reset_otp(user, code, *, channel, ttl_minutes)` in `accounts/services/notifications.py` already dispatches on `channel` and raises `NotImplementedError` for anything other than `"email"`. `PasswordResetRequest.CHANNEL_CHOICES` already has room for an `"sms"` value. Adding SMS later means: (1) add `("sms", "SMS")` to `CHANNEL_CHOICES`, (2) implement `_send_via_sms(user, code, ttl_minutes)` calling a provider, (3) add one `elif channel == "sms":` branch in the dispatcher. No changes to the model, serializers, views, migration, or frontend contract are needed — the request/verify/confirm flow is already channel-agnostic. Not implemented now, per the task's explicit instruction.
