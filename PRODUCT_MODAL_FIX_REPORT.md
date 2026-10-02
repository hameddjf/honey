# گزارش رفع: کرش صفحه‌ی محصول + باز نشدن مودال صفحه‌ی اصلی — ثبت وضعیت

**وضعیت: ✅ رفع شد (با تست jsdom)** — تاریخ: 2026-10-02

## ۱) علامت‌ها
1. صفحه‌ی `/product/[slug]` با این خطا می‌ترکید:
   `Uncaught TypeError: Cannot read properties of undefined (reading 'title')` (خط `document.title = product.title ...` در `_bodyScript.js`)
2. در صفحه‌ی اصلی، کلیک روی تصویر محصول هیچ مودالی (فواید و خواص / قیمت / افزودن به سبد) باز نمی‌کرد.

## ۲) علت ریشه‌ای (یک علت برای هر دو)
هر دو صفحه محصولات را فقط از `GET /products/` می‌خواندند و در صورت خطا این را می‌گذاشتند:
```js
fetchProducts().catch(() => ({ bySlug: {} }))   // ❌ لیست خالی
```
وقتی بک‌اند در دسترس نبود (لوکال بدون `runserver`، آدرس `NEXT_PUBLIC_API_URL` اشتباه، Render در حال بیدار شدن، CORS)،
`PRODUCTS` خالی می‌شد:
- صفحه‌ی محصول: `PRODUCTS['citrus']` هم `undefined` بود ← `product.title` ← **TypeError**.
- صفحه‌ی اصلی: `openModal` با `if (!p) return;` بی‌صدا خارج می‌شد ← **مودال باز نمی‌شد**.

(تصاویر ربطی ندارند: همه‌ی عکس‌ها عمداً یک‌بار دانلود و داخل `frontend/public/images/**` ذخیره شده‌اند تا سایت به سایت خارجی وابسته نباشد — این رفتار درست است و ربطی به خطا ندارد. ← `REAL_IMAGE_SOURCES.md`)

## ۳) تغییرات
| فایل | تغییر |
|---|---|
| `frontend/lib/products.js` | **جدید:** `offlineCatalog()` و `fetchProductsSafe()` — هرگز throw نمی‌کند و هرگز لیست خالی نمی‌دهد؛ اگر API خطا بدهد/خالی باشد، از کاتالوگ تزئینی داخلی (`productsCosmetic.js`) استفاده می‌کند. در cache ذخیره نمی‌شود. |
| `frontend/app/page.js`, `app/shop/ShopClient.js`, `app/product/[slug]/ProductClient.js` | `fetchProducts().catch(() => ({bySlug:{}}))` ← `fetchProductsSafe()` |
| `frontend/app/product/[slug]/_bodyScript.js` | اگر اسلاگ نبود → اولین محصول؛ اگر هیچ محصولی نبود → خروج بی‌صدا (`if (!product) return;`)؛ `benefits`/`emoji` ایمن شدند. |
| `frontend/app/_bodyScript.js` | `benefits`/`emoji` در مودال ایمن شدند (محصولِ ساخته‌شده در پنل ادمین بنفیت ندارد). |

## ۴) تأیید
آزمون jsdom روی همین کد، با `fetch` که خطا می‌دهد (بک‌اند خاموش):
| آزمون | نتیجه |
|---|---|
| `fetchProductsSafe()` | ۷ محصول آفلاین برمی‌گرداند |
| صفحه‌ی اصلی: کلیک روی تصویر «عسل سیاه تلو» | مودال باز شد؛ عنوان، قیمت ۳۱۰,۰۰۰ و ۴ مورد فواید درست؛ ۰ خطا |
| `/product/dark` | عنوان درست؛ ۰ خطا |
| `/product/nonexistent` | بدون کرش (محصول پیش‌فرض) |
| کاتالوگ کاملاً خالی | بدون کرش |

⚠️ فقط `next dev`/`vite` واقعی روی ماشین خودتان باقی مانده؛ بعد از `npm run build:vinext` باید `OK (config + bundle)` ببینید.

## ۵) نکته‌ی مهم محیط
اگر روی Cloudflare می‌خواهید قیمت/موجودی **زنده** باشد، موقع build حتماً `NEXT_PUBLIC_API_URL` درست باشد
(مثلاً `https://honey-388l.onrender.com/api/v1`) و بک‌اند Render بیدار باشد. وگرنه سایت با داده‌ی آفلاین (قیمت‌های پیش‌فرض) کار می‌کند.

## ۶) قوانین (برای هر هوش مصنوعی/برنامه‌نویس بعدی) — نباید نقض شود
1. صفحه‌های نمایشی (home/shop/product) فقط از `fetchProductsSafe()` استفاده کنند؛ هرگز `.catch(() => ({ bySlug: {} }))`.
2. اسکریپت‌های `_bodyScript.js` نباید فرض کنند `PRODUCTS[...]`، `benefits` یا `emoji` وجود دارد.
3. کلیک روی تصویر کارت در صفحه‌ی اصلی = باز شدن مودال (نه رفتن به صفحه‌ی محصول)؛ فلش کوچک گوشه‌ی کارت = صفحه‌ی کامل.
4. عکس‌های داخل `public/images/**` را حذف یا به hotlink تبدیل نکنید.
