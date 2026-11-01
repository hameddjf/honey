# seed_demo — what it creates (current)

`python manage.py seed_demo` (needs internet: Wikimedia Commons + Pexels; behind a filter use a VPN or `HTTPS_PROXY`)

| Item | Details |
|---|---|
| Categories | «عسل‌ها»، «ژل رویال و ترکیبات ویژه» |
| Products (7) | slug → name: `sunflower` عسل کلزا · `forest` عسل جنگل (نمدار) · `citrus` عسل مرکبات · `dark` عسل سیاه تلو · `blossom` عسلک ترنجبین · `sunflower-honey` عسل آفتابگردان · `royal-jelly` ژل رویال (**featured**) |
| Unit of sale | Honey: **500 g = 800,000 toman** (1 kg = qty 2 = 1,600,000; 2 kg = qty 4 = 3,200,000). Royal jelly: **10 g = 600,000 toman** (50 g = qty 5, 100 g = qty 10; 15 g by phone). Stock 40 each. Real per-package variants are a post-launch task. |
| Photos | 3–6 per product, downloaded to MEDIA_ROOT (generic Wikimedia Commons search results — replace with your own product photos). Failure to reach the sites is a warning; use `--require-images` to make it fatal. |
| Blog | 8 posts (6 original + `honey-and-infants`, `royal-jelly-guide`, both with source links) |
| Media library | 6 Pexels photos (hero, about, blog, bee, festival, contact) |
| Site content | hero, top bar («ارسال رایگان بالای ۱٫۵ میلیون»), promo, video link, footer, contact details (re-applied on every run) |
| Store settings | shipping 45,000 toman; free above 1,500,000 (only set the first time) |
| **Not created** | users, admin accounts, orders, addresses. Create your admin with `python manage.py createsuperuser`. |

Contact details seeded: phone 09365522762 · instagram.com/Nika_honey1 · t.me/Nika_honey1 · rubika.ir/Nika_honey1 · wa.me/989365522762 · info@nikahoney.ir · استان گلستان، شهرستان کلاله، روستای یاساقلق
