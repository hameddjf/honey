> ⚠️ **این راهنمای عمومی قدیمی‌تر است.** برای دستورهای دقیق و به‌روز این پروژه به `../DEPLOY-ONLINE.md` (بخش ۳) و `../DEPLOY_FIX_REPORT.md` نگاه کنید. نکتهٔ حیاتی: در `vite.config.ts` پلاگین Cloudflare باید با `viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }` صدا زده شود (نه `cloudflare()` ساده)، وگرنه دیپلوی با خطای ۱۰۰۲۱ شکست می‌خورد. پس از هر تغییر: `npm run build:vinext` باید با `[verify-worker-bundle] OK` تمام شود.

# راهنمای آنلاین کردن پروژه روی Cloudflare Workers

این راهنما بر اساس مستندات رسمی Cloudflare (به‌روزرسانی شده تا ۲۵ اوت ۲۰۲۶) نوشته شده. روش پیشنهادی و پیش‌فرض خود Cloudflare برای اجرای Next.js روی Workers، ابزاری به اسم **vinext** است (جایگزین روش قدیمی‌تر OpenNext). دستورات Next.js را از داخل پوشه `frontend/` اجرا کن.

> نکته: vinext هنوز در مرحله بتاست. اگر در مرحله «بررسی سازگاری» (قدم ۲) با مشکلی خوردی، در انتهای همین فایل روش جایگزین (OpenNext) رو هم آوردم.

---

## پیش‌نیازها

- Node.js نسخه ۱۸ به بالا نصب باشه
- یک حساب کاربری رایگان در [Cloudflare](https://dash.cloudflare.com/sign-up)
- پروژه (همین فولدر `nika-honey`) روی سیستم شما اکسترکت شده باشه

---

## مرحله ۱: نصب پکیج‌ها و ورود به حساب Cloudflare

```bash
cd nika-honey/frontend
npm install
npx wrangler login
```

دستور آخر یک تب مرورگر باز می‌کنه؛ با حساب Cloudflare‌ت وارد شو و اجازه دسترسی بده.

---

## مرحله ۲: بررسی سازگاری پروژه با vinext

```bash
npx vinext check
```

اگر موردی گزارش شد، قبل از رفتن به مرحله بعد بررسی و برطرفش کن. پروژه فعلی (App Router ساده + چند صفحه استاتیک) باید بدون مشکل رد بشه.

---

## مرحله ۳: فعال‌سازی vinext روی پروژه

```bash
npx vinext init
```

- وقتی سوال «کدوم پلتفرم رو هدف قرار می‌دی؟» رو پرسید، گزینه‌ی **Cloudflare Workers** رو انتخاب کن.
- این دستور غیرمخرب (non-destructive) هست؛ یعنی `next dev` معمولی هم بعدش کار می‌کنه، فقط چند اسکریپت و فایل تنظیمات جدید برای Cloudflare اضافه می‌کنه.

---

## مرحله ۴: تست لوکال با vinext

```bash
npm run dev:vinext
```

پروژه رو با آدرس محلی که نشون می‌ده باز کن و مطمئن شو همه صفحات (`/`, `/shop`, `/cart`, `/product/citrus`, `/about`, `/contact`, `/blog`, `/faq`) درست باز می‌شن.

---

## مرحله ۵: ساخت نسخه Production

```bash
npm run build:vinext
```

---

## مرحله ۶: دیپلوی روی Cloudflare Workers

```bash
npx @vinext/cloudflare deploy
```

بعد از اتمام، یک آدرس به شکل `https://nika-honey.<your-subdomain>.workers.dev` بهت می‌ده — پروژه از همون لحظه آنلاینه.

### اتصال دامنه اختصاصی (اختیاری)

اگه دامنه‌ی خودت (مثلاً nikahoney.ir) رو داری و می‌خوای بهش وصلش کنی:

1. دامنه رو در پنل Cloudflare (بخش Websites) اضافه و DNS‌اش رو منتقل کن.
2. برو به Workers & Workers → پروژه `nika-honey` → تب **Settings → Domains & Routes**.
3. گزینه **Custom Domain** رو بزن و دامنه‌ت رو وارد کن.

---

## به‌روزرسانی‌های بعدی

هر وقت تغییری در کد دادی، کافیه دوباره این دو دستور رو بزنی:

```bash
npm run build:vinext
npx @vinext/cloudflare deploy
```

---

## اگه vinext جواب نداد: روش جایگزین با OpenNext

اگر در مرحله ۲ یا ۳ با خطای سازگاری خوردی، می‌تونی از آداپتور قدیمی‌تر و پایدارتر OpenNext استفاده کنی:

```bash
npm install --save-dev wrangler @opennextjs/cloudflare
```

یک فایل `wrangler.jsonc` در ریشه پروژه بساز:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "nika-honey",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

سپس در `package.json` این دو اسکریپت رو اضافه کن:

```json
"preview": "opennextjs-cloudflare build && wrangler dev",
"deploy": "opennextjs-cloudflare build && wrangler deploy"
```

و برای دیپلوی:

```bash
npx wrangler login
npm run deploy
```

---

## خلاصه دستورات (روش اصلی vinext)

```bash
cd nika-honey/frontend
npm install
npx wrangler login
npx vinext check
npx vinext init
npm run build:vinext
npx @vinext/cloudflare deploy
```
