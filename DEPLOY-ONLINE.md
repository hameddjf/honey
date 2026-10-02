# راهنمای آنلاین کردن نیکا هانی (Neon + Render + Cloudflare)

بک‌اند: https://honey-388l.onrender.com
فرانت: https://nika-honey.kj1378242.workers.dev
دیتابیس: Neon (PostgreSQL)

> دستورها برای **Windows CMD** نوشته شده. در CMD حتماً مقدار را داخل `"..."` بگذارید،
> چون کاراکتر `&` در آدرس دیتابیس در غیر این صورت دستور را می‌شکند.

---

## ۰) قبل از هر چیز: امنیت
پسورد دیتابیس و SECRET_KEY در چت ارسال شده‌اند، پس لو رفته حساب می‌شوند. قبل از انتشار واقعی:
1. Neon → Dashboard → Roles → `neondb_owner` → **Reset password**
2. یک SECRET_KEY جدید بسازید:
   ```cmd
   python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
   ```
3. مقدار جدید را در Render (Environment) و در همین CMD ها جایگزین کنید.

---

## ۱) متغیرهای Render (Environment)
همان‌هایی که فرستادید + این‌ها اضافه شود تا هم دیتابیس و هم CORS درست کار کند:

| Key | Value |
|---|---|
| CORS_ALLOWED_ORIGINS | https://nika-honey.kj1378242.workers.dev |
| CSRF_TRUSTED_ORIGINS | https://nika-honey.kj1378242.workers.dev,https://honey-388l.onrender.com |
| DATABASE_URL | (رشته‌ی Neon) |
| DJANGO_ALLOWED_HOSTS | honey-388l.onrender.com |
| DJANGO_DEBUG | false |
| DJANGO_SECRET_KEY | (کلید جدید) |
| DJANGO_SETTINGS_MODULE | config.settings.production |
| PYTHON_VERSION | 3.11.5 |

تنظیمات سرویس Render:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
- Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Health Check Path: `/api/v1/health/`

---

## ۲) اتصال به Neon، migrate و seed (از کامپیوتر خودتان)
چرا از لوکال؟ seed عکس‌ها را دانلود می‌کند و روی Render فضای دائمی نیست. دیتابیس مشترک است، پس اجرای لوکال همان نتیجه را روی سایت آنلاین می‌دهد.

```cmd
cd nika-honey-project\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

set "DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-withered-pond-b1wkaqbb-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
set "DJANGO_SETTINGS_MODULE=config.settings.production"
set "DJANGO_SECRET_KEY=KEY"
set "DJANGO_ALLOWED_HOSTS=honey-388l.onrender.com"
set "DJANGO_SECURE_SSL_REDIRECT=false"

python manage.py check
python manage.py migrate
python manage.py seed_demo --no-uploads
python manage.py createsuperuser
```

- `--no-uploads` یعنی تصاویر محصولات و بلاگ از فایل‌های استاتیک فرانت (`public/images`) خوانده شوند، نه از `/media/` که روی Render وجود ندارد.
- به‌جای `PASSWORD` و `KEY` مقدارهای واقعی/جدید را بگذارید.
- اگر بعداً seed را دوباره زدید، امن است (idempotent).

### حساب‌های دمو
seed این حساب‌ها را می‌سازد: `staff@nikahoney.local / staff-pass-123` (ادمین) و `demo@nikahoney.local / demo-pass-123`.
روی سایت آنلاین حتماً با حساب خودتان (createsuperuser) وارد شوید و بعد این دو حساب را از پنل ادمین غیرفعال یا حذف کنید.

### بررسی
```cmd
curl https://honey-388l.onrender.com/api/v1/health/
curl https://honey-388l.onrender.com/api/v1/products/
curl https://honey-388l.onrender.com/api/v1/content/
```
(Render رایگان بعد از بی‌کاری می‌خوابد؛ اولین درخواست ۳۰ تا ۶۰ ثانیه طول می‌کشد.)

---

## ۳) فرانت روی Cloudflare
نکته‌ی کلیدی: `NEXT_PUBLIC_API_URL` موقع **build** داخل کد قرار می‌گیرد. فایل `.env` ریشه مقدار لوکال (127.0.0.1) دارد، اما مقداری که از قبل در همان پنجره‌ی CMD ست شده باشد را overwrite نمی‌کند (تست شد: بعد از build هیچ ردی از 127.0.0.1 نیست).

اگر نسخه‌ی v2 جدید (این zip) را باز کرده‌اید، vinext از قبل تنظیم شده و فقط این لازم است:

```cmd
cd nika-honey-project\frontend
set "NEXT_PUBLIC_API_URL=https://honey-388l.onrender.com/api/v1"
set "NEXT_PUBLIC_SITE_URL=https://nika-honey.kj1378242.workers.dev"
npm install
npx wrangler login
npm run build:vinext
npx @vinext/cloudflare deploy
```

اگر همچنان روی پوشه‌ی قبلی خودتان کار می‌کنید (که `vinext init` در آن خطای ERESOLVE داد):

```cmd
npm install -D vinext react-server-dom-webpack@19.2.8 @vinext/cloudflare @cloudflare/workers-response-store
npx vinext init --platform cloudflare --cdn-cache none --image-optimization none --skip-check
npm install -D @vitejs/plugin-rsc@^0.5.34
```
سپس همان چهار دستور آخر (`set`، `wrangler login`، `build:vinext`، `deploy`) را بزنید.

علت خطا: `react-server-dom-webpack` به‌صورت پیش‌فرض نسخه‌ی 19.3.0 را می‌خواست که React 19.3 لازم دارد، ولی پروژه روی React 19.2.8 است؛ پین کردن روی 19.2.8 مشکل را حل می‌کند. `@vitejs/plugin-rsc` هم جداگانه نصب نمی‌شد و همان چیزی بود که deploy می‌گفت Missing است.

درباره‌ی سوال‌های `vinext init`: سایت از `next/image` استفاده نمی‌کند، پس cache، Cloudflare Images و pre-warm لازم نیست. جواب ساده‌تر (none) کمتر خراب می‌شود.

- اگر پروژه‌ی `nika-honey` را قبلاً در Cloudflare ساخته‌اید، همان نام می‌ماند و آدرس `nika-honey.kj1378242.workers.dev` عوض نمی‌شود.
- اگر Cloudflare را به Git وصل کرده‌اید: Settings → Variables and Secrets (بخش **Build**) → دو متغیر بالا را اضافه کنید، Build command را `npm run build:vinext` بگذارید و دوباره deploy بگیرید.

> **مهم (رفع خطای ۱۰۰۲۱ — `No such module "__vinext_action_owner_manifest.js"`):** در `frontend/vite.config.ts` پلاگین Cloudflare باید دقیقاً به شکل `cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })` باشد، نه `cloudflare()` ساده. در این نسخه درست تنظیم شده؛ `npm run build:vinext` و `npm run deploy:vinext` خودشان بررسی می‌کنند و در صورت خراب بودن، پیش از آپلود با پیام روشن متوقف می‌شوند. دیپلوی پیشنهادی: `npm run build:vinext` و بعد `npm run deploy:vinext`. توضیح کامل: `DEPLOY_FIX_REPORT.md`.

## ۴) عیب‌یابی سریع
| علامت | علت | راه‌حل |
|---|---|---|
| خطای CORS در کنسول مرورگر | آدرس فرانت در `CORS_ALLOWED_ORIGINS` نیست یا `/` آخرش دارد | دقیقاً `https://nika-honey.kj1378242.workers.dev` بدون اسلش |
| سایت به `127.0.0.1` درخواست می‌زند | build بدون `NEXT_PUBLIC_API_URL` گرفته شده | متغیر را ست کنید و دوباره build/deploy |
| `ERESOLVE` هنگام vinext init | react-server-dom-webpack نسخه‌ی 19.3 | `npm install -D react-server-dom-webpack@19.2.8` (بخش ۳) |
| `vite is not recognized` | نصب‌ها ناقص ماند | دستورهای نصب بخش ۳ را کامل بزنید، بعد `npm run build:vinext` |
| ریدایرکت بی‌نهایت در Render | نسخه‌ی قدیمی production.py | نسخه‌ی جدید (دارای `SECURE_PROXY_SSL_HEADER`) را push کنید |
| `DisallowedHost` / ۴۰۰ | دامنه در `DJANGO_ALLOWED_HOSTS` نیست | `honey-388l.onrender.com` بدون `https://` |
| خطای SSL/channel_binding هنگام اتصال | psycopg2 قدیمی | `pip install -U psycopg2-binary` |
| عکس‌ها نمایش داده نمی‌شوند | seed بدون `--no-uploads` زده شده | `python manage.py seed_demo --no-uploads` را دوباره بزنید |
| `No such module "__vinext_action_owner_manifest.js"` هنگام deploy (کد 10021) | `cloudflare()` در `vite.config.ts` بدون `viteEnvironment` | `cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })` را بگذارید، بعد `npm run build:vinext` (باید `OK` بدهد) |
| `The "react" package ... "react-server" condition must be enabled` | همان علت بالا | همان راه‌حل |
