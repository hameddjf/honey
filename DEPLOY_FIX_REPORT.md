# گزارش رفع خطای دیپلوی Cloudflare (کد ۱۰۰۲۱) — ثبت وضعیت

**وضعیت: ✅ رفع شد و با نگهبان خودکار قفل شد** — تاریخ: 2026-10-02

## ۱) علامت‌ها

هنگام `cf deploy` (بعد از آپلود موفق ۷۷ فایل استاتیک) این خطا می‌آمد:

```
[10021] Uncaught Error: No such module "__vinext_action_owner_manifest.js".
  imported from "index.js"
```

بعد از رفع همین خطا، خطای دوم هم زیرش پنهان بود (روی workerd بازتولید شد):

```
Uncaught Error: The "react" package in this environment is not configured correctly.
The "react-server" condition must be enabled in any environment that runs React Server Components.
```

## ۲) علت ریشه‌ای (فقط یک خط!)

در `frontend/vite.config.ts` پلاگین Cloudflare به شکل ساده صدا زده شده بود:

```ts
cloudflare()                                  // ❌ غلط برای App Router
```

vinext (حالت App Router) لازم دارد Worker در محیط Vite به نام **`rsc`** ساخته شود:

```ts
cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })   // ✅
```

با `cloudflare()` ساده، Worker در محیط `ssr` ساخته می‌شد. نتیجه دو خطای بالا بود:

1. vinext فایل `__vinext_action_owner_manifest.js` را در پوشهٔ خروجی محیط `rsc` (یعنی `dist/server`) می‌نویسد، ولی Worker در `.cloudflare/output/v0/workers/default/bundle` بود. `index.js` به آن فایل `import` داشت ولی فایل در bundle نبود ← خطای ۱۰۰۲۱.
2. کد RSC بدون شرط `react-server` bundle می‌شد و React نسخهٔ client داخل Worker می‌رفت ← خطای دوم.

خود `vinext init` هم برای App Router همین پیکربندی صحیح را تولید می‌کند و در کدش تصریح دارد که `cloudflare()` ساده «باعث می‌شود محیط RSC هرگز در workerd اجرا نشود».

## ۳) تغییرات

| فایل | تغییر |
|---|---|
| `frontend/vite.config.ts` | `cloudflare()` ← `cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })` + کامنت هشدار |
| `frontend/scripts/verify-worker-bundle.mjs` | **جدید.** نگهبان: هم پیکربندی را چک می‌کند هم bundle ساخته‌شده را (هر `import` نسبی باید فایلش داخل bundle باشد) |
| `frontend/package.json` | `build:vinext` = `vite build` + نگهبان؛ `predeploy:vinext` (پیش از `deploy:vinext` خودکار اجرا می‌شود)؛ `verify:vinext` |
| `frontend/AGENTS.md` و `AGENTS.md` | قوانین صریح برای هر هوش مصنوعی/برنامه‌نویسی که بعداً پروژه را تغییر دهد |
| `DEPLOY-ONLINE.md`, `frontend/DEPLOY-CLOUDFLARE.md` | هشدار + ردیف‌های جدید عیب‌یابی |

> یک راه‌حل اول (کپی‌کردن خودکار فایل گمشده به bundle) ساخته و **عمداً کنار گذاشته شد**: فقط علامت اول را می‌پوشاند و خطای دوم (`react-server`) همچنان باقی می‌ماند. رفع واقعی در ریشه است.

## ۴) چطور تأیید شد

| آزمون | نتیجه |
|---|---|
| بازتولید خطا با پیکربندی قدیمی (`vite preview` = workerd، همان موتور Cloudflare) | خطای ۱۰۰۲۱ دقیقاً با همان متن بازتولید شد |
| پیکربندی جدید + build از صفر | همهٔ فایل‌های `__vinext_*` و پوشهٔ `ssr/` خودشان داخل bundle ساخته شدند (بدون هیچ patch) |
| بالا آوردن Worker در workerd و درخواست صفحات | `/ /shop /cart /blog /product/citrus /login /about /faq /robots.txt /sitemap.xml` و تصویر محصول: همه **HTTP 200**؛ صفحهٔ ناموجود: **404**؛ تیتر فارسی و `dir="rtl"` درست؛ صفر خطای `No such module` / `react-server` در لاگ |
| نگهبان با پیکربندی درست | `OK (config + bundle)` |
| نگهبان با برگرداندن عمدی به `cloudflare()` ساده | `build:vinext` و `predeploy:vinext` با کد خروج ۱ **متوقف** شدند و پیام رفع را چاپ کردند |

⚠️ **محدودیت:** آپلود نهایی واقعی (`cf deploy` با حساب Cloudflare شما) در محیط من قابل اجرا نبود (توکن ندارم). همه‌چیز تا قبل از آن روی همان runtime تست شد، ولی اولین دیپلوی واقعی را خودتان انجام دهید و نتیجه را بررسی کنید.

## ۵) دیپلوی درست (Windows CMD)

```cmd
cd nika-honey-project\frontend
set "NEXT_PUBLIC_API_URL=https://honey-388l.onrender.com/api/v1"
set "NEXT_PUBLIC_SITE_URL=https://nika-honey.kj1378242.workers.dev"
npm install
npm run build:vinext
npm run deploy:vinext
```

اگر جایی نوشته بود `npx @vinext/cloudflare deploy` هم همان کار را می‌کند؛ ولی `npm run deploy:vinext` قبلش نگهبان را اجرا می‌کند.

## ۶) اگر دوباره این خطا آمد

1. `npm run verify:vinext` را بزنید؛ پیام نگهبان علت را می‌گوید.
2. مطمئن شوید در `vite.config.ts` پلاگین `cloudflare(...)` دارای `viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }` است.
3. اگر `vinext init` را دوباره اجرا کردید یا پکیج‌ها را آپدیت کردید، بعدش `npm run build:vinext` را بزنید و مطمئن شوید پایانش `[verify-worker-bundle] OK` است.
4. پیش از دیپلوی می‌توانید روی همان runtime تست کنید: `npm run build:vinext` سپس `npm run start:vinext` و باز کردن آدرس محلی.

## ۷) قوانین برای هر کس (و هر هوش مصنوعی) که پروژه را تغییر می‌دهد

- ❌ `cloudflare()` را در `vite.config.ts` به شکل ساده یا بدون `viteEnvironment` ننویسید.
- ❌ فایل‌ها را دستی داخل `.cloudflare/output` یا `dist` کپی/ویرایش نکنید؛ این پوشه‌ها خروجی build هستند.
- ❌ برای «رفع» این خطا `wrangler.jsonc` یا OpenNext اضافه نکنید؛ پروژه روی `cf` + vinext تنظیم است.
- ❌ نگهبان را حذف یا دور نزنید؛ اگر fail شد علتش را رفع کنید.
- ✅ بعد از هر تغییر در build/دیپلوی: `npm run build:vinext` باید با `OK` تمام شود.
