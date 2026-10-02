"""
Populate ALL development/demo data the application currently supports:
categories, products (with full descriptions, size and images), demo
users, demo orders across the fulfillment workflow, storefront content
(including the intro video), and blog posts.

Safe and idempotent — every section is keyed by something stable (a
name, a slug, an order marker) and uses get_or_create/update_or_create,
so running this command again repairs/updates existing rows instead of
duplicating them. Works against a fresh SQLite database and, after
`migrate`, equally against Postgres (nothing here is SQLite-specific).
"""

import time
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image

from accounts.models import Address
from content.models import BlogPost, MediaAsset, SiteContent, StoreSettings
from orders.models import Order, OrderItem
from products.models import Category, Product, ProductImage

User = get_user_model()

CATEGORIES = [
    {"name": "عسل‌ها", "description": "انواع عسل طبیعی"},
    {"name": "ژل رویال و ترکیبات ویژه", "description": "ژل رویال و محصولات ترکیبی ویژه"},
]

# stable_slug: matches frontend/lib/products.js's SLUG_BY_NAME and is used
# to select deterministic real-photo sources below. It is not stored in Django.
PRODUCTS = [
    {
        "name": "عسل مرکبات",
        "stable_slug": "citrus",
        "category": "عسل‌ها",
        "short_description": "عسل خالص با عطر مرکبات",
        "description": (
            "عسل مرکبات نیکا از شهد باغ‌های پرتقال و نارنگی شمال کشور به‌دست می‌آید و "
            "رایحه‌ای تازه و مرکباتی دارد که آن را به گزینه‌ای دلپذیر برای صبحانه و "
            "نوشیدنی‌های گرم تبدیل می‌کند. رنگ روشن و بافت نرم آن، همراه با شیرینی "
            "متعادل، این عسل را محبوب علاقه‌مندان به طعم‌های ملایم کرده است."
        ),
        "price": Decimal("450000"),
        "previous_price": Decimal("495000"),
        "stock": 50,
        "is_featured": True,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل کلزا",
        "stable_slug": "sunflower",
        "category": "عسل‌ها",
        "short_description": "عسل روشن و خوش‌طعم کلزا",
        "description": (
            "عسل کلزا با رنگ روشن و طعمی ملایم، یکی از پرمصرف‌ترین عسل‌های خانگی است. "
            "به‌دلیل درصد بالای گلوکز، این عسل معمولاً ظرف چند هفته پس از برداشت بلوره "
            "می‌شود — نشانه‌ای از خام و طبیعی بودن آن، نه افت کیفیت. مناسب مصرف روزانه "
            "و همراهی با نان و لبنیات صبحانه."
        ),
        "price": Decimal("380000"),
        "stock": 40,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل سیاه تلو",
        "stable_slug": "dark",
        "category": "عسل‌ها",
        "short_description": "عسل تیره و کوهستانی تلو",
        "description": (
            "عسل سیاه تلو از مناطق کوهستانی و صعب‌العبور برداشت می‌شود و به‌دلیل تنوع "
            "گیاهی منطقه، طعمی غلیظ و عطری قوی دارد. رنگ تیره‌ی این عسل نشانه‌ی غلظت "
            "بالای مواد معدنی و آنتی‌اکسیدان‌هاست؛ گزینه‌ای مناسب برای فصل سرما و "
            "تقویت روزانه‌ی بدن."
        ),
        "price": Decimal("520000"),
        "stock": 30,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل نمدار",
        "stable_slug": "forest",
        "category": "عسل‌ها",
        "short_description": "عسل معطر گل نمدار",
        "description": (
            "عسل نمدار از شهد درختان نمدار جنگل‌های هیرکانی به‌دست می‌آید و رایحه‌ای "
            "خاص و آرامش‌بخش دارد که در طب سنتی برای تسکین اعصاب و کمک به خواب راحت "
            "شناخته می‌شود. طعم آن ملایم‌تر از عسل‌های کوهستانی و برای مصرف روزانه "
            "خانواده مناسب است."
        ),
        "price": Decimal("470000"),
        "stock": 35,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل خارشتر",
        "stable_slug": "khareshtor",
        "category": "عسل‌ها",
        "short_description": "عسل خاص گیاه خارشتر",
        "description": (
            "عسل خارشتر از گیاه بومی مناطق کویری و نیمه‌خشک ایران تهیه می‌شود و در طب "
            "سنتی به خواص گوارشی و ضدسرفه‌ی آن اشاره می‌شود. طعم آن نسبت به سایر "
            "عسل‌های این مجموعه کمی تندتر و خاص‌تر است و طرفداران خاص خودش را دارد."
        ),
        "price": Decimal("410000"),
        "stock": 25,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل ترنجبین",
        "stable_slug": "blossom",
        "category": "عسل‌ها",
        "short_description": "عسل مخصوص همراه با ترنجبین",
        "description": (
            "این عسل با ترکیب طبیعی ترنجبین تهیه شده و در طب سنتی برای تسکین سرفه و "
            "گلودرد فصلی استفاده می‌شود. بافت غلیظ‌تر و طعم متفاوت آن، آن را به گزینه‌ی "
            "مناسبی برای فصل‌های سرد سال و همراهی با دمنوش‌های گیاهی تبدیل کرده است."
        ),
        "price": Decimal("490000"),
        "stock": 20,
        "size_value": Decimal("450"),
        "size_unit": "g",
    },
    {
        "name": "عسل + ژل رویال",
        "stable_slug": "mix",
        "category": "ژل رویال و ترکیبات ویژه",
        "short_description": "ترکیب عسل طبیعی و ژل رویال تازه",
        "description": (
            "ترکیبی از عسل خالص نیکا و ژل رویال تازه، تهیه‌شده برای کسانی که به دنبال "
            "یک مکمل تقویتی طبیعی هستند. ژل رویال یکی از غنی‌ترین ترکیبات طبیعی از نظر "
            "ویتامین‌های گروه B و اسیدهای آمینه است و در این محصول با بهترین عسل نیکا "
            "همراه شده تا مصرف روزانه‌ی آن آسان‌تر و خوشمزه‌تر باشد."
        ),
        "price": Decimal("890000"),
        "previous_price": Decimal("950000"),
        "stock": 15,
        "is_featured": True,
        "size_value": Decimal("300"),
        "size_unit": "g",
    },
]

# (top_color, bottom_color) gradient per stable_slug — purely cosmetic and
# deterministic, so the same product always gets the same placeholder look.
PLACEHOLDER_PALETTE = {
    "citrus": ("#F6CE7C", "#C07A2B"),
    "sunflower": ("#EFDA9A", "#B08A2E"),
    "dark": ("#8C5A2B", "#3A230D"),
    "forest": ("#E7BD68", "#8A5A1E"),
    "khareshtor": ("#DCA84A", "#7A4E14"),
    "blossom": ("#F2D68E", "#B4832A"),
    "mix": ("#EEC257", "#8E5F17"),
}

# A handful of demo orders for the demo customer, spread across the
# fulfillment workflow so the staff order-list has something to show.
DEMO_ORDER_STATUSES = [
    Order.Status.PENDING,
    Order.Status.CONFIRMED,
    Order.Status.PREPARING,
    Order.Status.SHIPPED,
    Order.Status.DELIVERED,
]

# (stable_slug, quantity) per order stage — varied on purpose so the demo
# order list doesn't look like the same line repeated five times.
DEMO_ORDER_LINES = {
    Order.Status.PENDING: [("citrus", 2)],
    Order.Status.CONFIRMED: [("dark", 1), ("blossom", 1)],
    Order.Status.PREPARING: [("mix", 1)],
    Order.Status.SHIPPED: [("forest", 3)],
    Order.Status.DELIVERED: [("sunflower", 2), ("khareshtor", 1)],
}

# Ported from frontend/lib/blog.js — same title/excerpt/tag/slug/author so
# the backend has the same real editorial content as the (still locally
# rendered) public blog pages, not lorem ipsum. `body` joins the original
# heading/paragraph blocks into lightweight markdown ("## heading").
# publish dates are fixed Gregorian constants (not "now() - N days") so
# re-running this command is fully deterministic.
BLOG_POSTS = [
    {
        "slug": "spot-fake-honey",
        "title": "چطور عسل طبیعی را از تقلبی تشخیص دهیم؟",
        "tag": "راهنما",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/spot-fake-honey.jpg",
        "excerpt": "چند روش ساده و خانگی برای بررسی خلوص عسل، پیش از خرید یا در خانه.",
        "published_at": datetime(2026, 6, 2, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## چرا تشخیص عسل تقلبی مهم است؟\n\n"
            "عسل تقلبی معمولاً با شربت قند، گلوکز یا شکر مصنوعی ترکیب می‌شود تا حجم و "
            "سود بیشتری داشته باشد. این نوع عسل نه‌تنها خواص درمانی و تغذیه‌ای عسل "
            "طبیعی را ندارد، بلکه می‌تواند برای افراد دیابتی یا حساس به قند مضر باشد. "
            "خوشبختانه با چند تست ساده خانگی می‌توان حدس خوبی درباره‌ی خلوص عسل زد.\n\n"
            "## تست آب و ته‌نشینی\n\n"
            "یک قاشق عسل را در یک لیوان آب سرد بریزید. عسل طبیعی به‌آرامی و به‌شکل یک "
            "رشته‌ی منسجم ته‌نشین می‌شود و به‌سختی در آب حل می‌شود. عسل تقلبی معمولاً "
            "خیلی سریع در آب پخش و حل می‌شود.\n\n"
            "## تست شعله\n\n"
            "کمی عسل را روی یک فتیله یا چوب‌کبریت خشک بمالید و سعی کنید آن را روشن "
            "کنید. عسل خالص به‌دلیل رطوبت پایین معمولاً می‌سوزد، درحالی‌که عسل دارای "
            "آب یا شکر افزوده به‌سختی شعله می‌گیرد یا جرقه می‌زند.\n\n"
            "## بلوره‌شدن، نشانه‌ی خوب یا بد؟\n\n"
            "برخلاف تصور رایج، بلوره‌شدن عسل در دمای پایین یک فرآیند کاملاً طبیعی است و "
            "نشانه‌ی خلوص بالای عسل محسوب می‌شود، نه تقلبی بودن آن. عسل‌هایی مثل عسل "
            "کلزا به‌دلیل درصد بالای گلوکز سریع‌تر بلوره می‌شوند.\n\n"
            "## بهترین راه، خرید مطمئن است\n\n"
            "تست‌های خانگی فقط راهنمای اولیه هستند و قطعیت آزمایشگاهی ندارند. "
            "مطمئن‌ترین راه، خرید از تولیدکننده‌ای است که خلوص و منشأ عسل خود را شفاف "
            "اعلام می‌کند؛ دقیقاً همان چیزی که در نیکا برای هر بچه محصول رعایت می‌کنیم."
        ),
    },
    {
        "slug": "storage-tips",
        "title": "بهترین روش نگهداری عسل در خانه",
        "tag": "نگهداری",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/storage-tips.jpg",
        "excerpt": "دما، نور و نوع ظرف چه تاثیری روی ماندگاری و کیفیت عسل شما دارند؟",
        "published_at": datetime(2026, 6, 24, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## دمای نگهداری ایده‌آل\n\n"
            "عسل را در دمای اتاق و به‌دور از منابع حرارتی مانند اجاق گاز یا نور مستقیم "
            "آفتاب نگهداری کنید. گرمای زیاد باعث از بین رفتن آنزیم‌ها و برخی خواص عسل "
            "می‌شود، هرچند طعم و ماندگاری آن به‌طور کامل از بین نمی‌رود.\n\n"
            "## ظرف مناسب\n\n"
            "بهترین ظرف برای نگهداری عسل، شیشه‌ی دردار با درپوش محکم است. ظروف فلزی "
            "می‌توانند با اسیدهای طبیعی عسل واکنش دهند و طعم آن را تغییر دهند، بنابراین "
            "بهتر است از آن‌ها اجتناب کنید.\n\n"
            "## آیا عسل باید در یخچال نگهداری شود؟\n\n"
            "نه. نگهداری در یخچال باعث بلوره‌شدن سریع‌تر عسل می‌شود و کار با آن را "
            "سخت‌تر می‌کند. عسل در دمای اتاق، در جای خشک و خنک، سال‌ها بدون فاسد شدن "
            "قابل نگهداری است.\n\n"
            "## اگر عسل بلوره شد چه کنیم؟\n\n"
            "کافی است ظرف عسل را داخل یک کاسه آب گرم (نه جوش) قرار دهید تا به‌آرامی به "
            "حالت مایع برگردد. هرگز عسل را مستقیم روی حرارت یا در مایکروویو با قدرت "
            "بالا گرم نکنید."
        ),
    },
    {
        "slug": "crystallization",
        "title": "چرا عسل بلوره می‌شود؟ آیا نشانه تقلبی بودن است؟",
        "tag": "پرسش رایج",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/crystallization.jpg",
        "excerpt": "بلوره‌شدن یک فرآیند کاملاً طبیعی است؛ توضیح می‌دهیم چرا و چطور برگردانیمش.",
        "published_at": datetime(2026, 7, 11, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## بلوره‌شدن یعنی چه؟\n\n"
            "عسل از ترکیب دو نوع قند اصلی، گلوکز و فروکتوز، تشکیل شده است. با گذشت "
            "زمان و در دمای پایین، گلوکز موجود در عسل به‌شکل بلورهای ریز جامد درمی‌آید "
            "و بافت عسل از حالت مایع شفاف به حالت نیمه‌جامد و کدر تغییر می‌کند.\n\n"
            "## آیا بلوره‌شدن نشانه‌ی تقلبی بودن است؟\n\n"
            "برعکس؛ عسل‌های خام و تصفیه‌نشده معمولاً سریع‌تر بلوره می‌شوند، چون فرآیند "
            "تصفیه و پاستوریزه‌کردن (که در عسل‌های صنعتی انجام می‌شود) بلوره‌شدن را به "
            "تاخیر می‌اندازد. پس بلوره‌شدن اغلب نشانه‌ی خوبی برای خام و طبیعی بودن عسل "
            "است.\n\n"
            "## کدام عسل‌ها سریع‌تر بلوره می‌شوند؟\n\n"
            "عسل‌هایی با درصد گلوکز بالاتر، مثل عسل کلزا و عسل ترنجبین، معمولاً ظرف چند "
            "هفته تا چند ماه بلوره می‌شوند. عسل‌های با فروکتوز بالاتر، مثل برخی "
            "عسل‌های گل صحرایی، ماه‌ها بیشتر به حالت مایع باقی می‌مانند.\n\n"
            "## چطور دوباره مایع‌اش کنیم؟\n\n"
            "ظرف عسل را (با درب باز یا بسته، بسته به جنس ظرف) داخل کاسه‌ای آب گرم قرار "
            "دهید تا بلورها به‌آرامی آب شوند. حرارت مستقیم و بالا از خواص عسل می‌کاهد."
        ),
    },
    {
        "slug": "cooking-with-honey",
        "title": "جایگزینی عسل به‌جای شکر در دستور پخت‌ها",
        "tag": "آشپزی",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/cooking-with-honey.jpg",
        "excerpt": "نسبت‌های پیشنهادی و نکاتی برای استفاده از عسل در پخت و نوشیدنی‌های گرم.",
        "published_at": datetime(2026, 7, 30, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## چرا عسل جایگزین بهتری است؟\n\n"
            "عسل نسبت به شکر تصفیه‌شده شیرینی طبیعی بیشتری دارد و همراه با آن مقداری "
            "ویتامین، آنتی‌اکسیدان و مواد معدنی نیز وارد بدن می‌شود. به همین دلیل در "
            "بسیاری از دستورهای پخت می‌توان با تنظیم نسبت، شکر را با عسل جایگزین "
            "کرد.\n\n"
            "## نسبت پیشنهادی جایگزینی\n\n"
            "به‌طور کلی برای هر یک پیمانه شکر، حدود سه‌چهارم پیمانه عسل استفاده کنید و "
            "به ازای هر پیمانه عسل اضافه‌شده، مایعات دستور را کمی (حدود دو تا سه قاشق "
            "غذاخوری) کاهش دهید، چون عسل خودش رطوبت دارد.\n\n"
            "## نکات پخت با عسل\n\n"
            "چون عسل در دمای بالا سریع‌تر قهوه‌ای و کاراملی می‌شود، بهتر است دمای فر را "
            "حدود ۱۰ تا ۱۵ درجه سانتی‌گراد پایین‌تر تنظیم کنید و کمی زمان پخت را افزایش "
            "دهید تا از سوختن سطح شیرینی جلوگیری شود.\n\n"
            "## استفاده در نوشیدنی‌های گرم\n\n"
            "برای چای و دمنوش، بهتر است عسل را زمانی اضافه کنید که دمای نوشیدنی کمی "
            "پایین آمده (نه در حال جوش)، تا بیشترین خواص و طعم عسل حفظ شود."
        ),
    },
    {
        "slug": "honey-types",
        "title": "تفاوت عسل تک‌گل و چندگل در چیست؟",
        "tag": "آموزشی",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/honey-types.jpg",
        "excerpt": "از طعم گرفته تا خواص؛ با معیارهای انتخاب نوع عسل مناسب شما آشنا شوید.",
        "published_at": datetime(2026, 8, 18, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## عسل تک‌گل چیست؟\n\n"
            "عسل تک‌گل (مونوفلورال) زمانی به‌دست می‌آید که زنبورها عمدتاً از شهد یک نوع "
            "گیاه خاص، مثل مرکبات یا کلزا، تغذیه کرده باشند. این نوع عسل معمولاً طعم و "
            "رایحه‌ی مشخص و یکنواخت‌تری دارد.\n\n"
            "## عسل چندگل چیست؟\n\n"
            "عسل چندگل (پلی‌فلورال) از شهد چند گونه گیاهی مختلف در یک منطقه به‌دست "
            "می‌آید و به همین دلیل معمولاً طعم پیچیده‌تر و متنوع‌تری دارد. عسل نمدار "
            "نمونه‌ای از این نوع عسل است.\n\n"
            "## کدام‌یک خواص بیشتری دارد؟\n\n"
            "هر دو نوع عسل خواص تغذیه‌ای مشابهی دارند، اما تنوع گیاهی در عسل‌های چندگل "
            "می‌تواند به تنوع بیشتر ترکیبات آنتی‌اکسیدانی کمک کند. انتخاب بین این دو "
            "بیشتر به ذائقه و کاربرد شما بستگی دارد.\n\n"
            "## کدام را انتخاب کنیم؟\n\n"
            "برای صبحانه و مصارف روزمره، عسل‌های ملایم‌تر مثل عسل مرکبات یا کلزا "
            "مناسب‌ترند. برای مصارف تقویتی و فصل‌های سرد، عسل‌های غلیظ‌تر مثل عسل سیاه "
            "یا عسل نمدار پیشنهاد می‌شود."
        ),
    },
    {
        "slug": "honey-cinnamon",
        "title": "ترکیب عسل و دارچین؛ افسانه یا واقعیت؟",
        "tag": "سلامت",
        "author": "تیم نیکا",
        "cover_image_url": "/images/blog/honey-cinnamon.jpg",
        "excerpt": "بررسی علمی ادعاهای رایج درباره این ترکیب محبوب در طب سنتی.",
        "published_at": datetime(2026, 9, 5, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## این ترکیب از کجا آمده؟\n\n"
            "ترکیب عسل و دارچین سال‌هاست در طب سنتی بسیاری از فرهنگ‌ها به‌عنوان یک "
            "درمان خانگی برای سرماخوردگی، گلودرد و حتی کاهش وزن شناخته شده است. اما "
            "چقدر از این ادعاها پشتوانه‌ی علمی دارد؟\n\n"
            "## چه چیزی واقعیت دارد؟\n\n"
            "هم عسل و هم دارچین به‌تنهایی خواص ضدالتهابی و آنتی‌اکسیدانی دارند و در "
            "تسکین گلودرد و سرفه‌ی خفیف می‌توانند مفید باشند. ترکیب این دو در چای گرم، "
            "یک نوشیدنی آرامش‌بخش و تاحدی مفید برای علائم سرماخوردگی است.\n\n"
            "## ادعاهایی که مبالغه‌آمیزند\n\n"
            "ادعاهایی مانند «کاهش وزن تضمینی» یا «درمان قطعی دیابت» با مصرف عسل و "
            "دارچین، شواهد علمی قوی و قطعی ندارند. این ترکیب می‌تواند بخشی از یک سبک "
            "زندگی سالم باشد، اما جایگزین رژیم غذایی متعادل یا درمان پزشکی نیست.\n\n"
            "## نکته‌ی مهم برای دیابتی‌ها\n\n"
            "با وجود خواص دارچین، عسل همچنان یک نوع قند طبیعی است و افراد دیابتی باید "
            "در مصرف آن با احتیاط و با مشورت پزشک عمل کنند."
        ),
    },
]


# ---------------------------------------------------------------------------
# Real photos (products + posters)
# ---------------------------------------------------------------------------
# `python manage.py seed_demo` DOWNLOADS every photo below once and stores it
# inside the project, so afterwards nothing is hotlinked:
#
#   1. backend/products/seed_images/downloaded/<key>.jpg   (download cache —
#      a re-run reuses these files instead of downloading again; delete a
#      file, or pass --refresh, to fetch it again; drop your own photo here
#      with the same name to override a download)
#   2. frontend/public/images/products/<slug>.jpg|<slug>-detail.jpg and
#      frontend/public/images/posters/<key>.jpg   (served by Next.js — these
#      are the exact paths the storefront already references)
#   3. Django MEDIA_ROOT (ProductImage / MediaAsset rows) for the API/admin
#
# To change a photo, edit its URL list below (the first URL that downloads
# wins; the following ones are fallbacks) and run `seed_demo --refresh`.
SEED_IMAGES_DIR = Path(__file__).resolve().parents[2] / "seed_images"      # bundled offline fallbacks
ASSETS_CACHE_DIR = SEED_IMAGES_DIR / "downloaded"                          # download cache
FRONTEND_PUBLIC_DIR = Path(__file__).resolve().parents[4] / "frontend" / "public"

_PX = "https://images.pexels.com/photos/"
PEXELS_URLS = {
    "8140790": _PX + "8140790/pexels-photo-8140790.jpeg?cs=srgb&dl=pexels-micheile-8140790.jpg&fm=jpg",
    "5247983": _PX + "5247983/pexels-photo-5247983.jpeg?cs=srgb&dl=pexels-anete-lusina-5247983.jpg&fm=jpg",
    "5247982": _PX + "5247982/pexels-photo-5247982.jpeg?cs=srgb&dl=pexels-anete-lusina-5247982.jpg&fm=jpg",
    "18751139": _PX + "18751139/pexels-photo-18751139.png?cs=srgb&dl=pexels-fernanda-nunez-760836228-18751139.jpg&fm=jpg",
    "18581553": _PX + "18581553/pexels-photo-18581553.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "30666803": _PX + "30666803/pexels-photo-30666803.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "1638280": _PX + "1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "6551047": _PX + "6551047/pexels-photo-6551047.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "8805426": _PX + "8805426/pexels-photo-8805426.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "11771949": _PX + "11771949/pexels-photo-11771949.jpeg?cs=srgb&dl=pexels-annmteu-11771949.jpg&fm=jpg",
    "4480158": _PX + "4480158/pexels-photo-4480158.jpeg?cs=srgb&dl=pexels-ian-panelo-4480158.jpg&fm=jpg",
    "8500508": _PX + "8500508/pexels-photo-8500508.jpeg?cs=srgb&dl=pexels-alexfalconer-8500508.jpg&fm=jpg",
    "11284797": _PX + "11284797/pexels-photo-11284797.jpeg?cs=srgb&dl=pexels-micheile-11284797.jpg&fm=jpg",
    "4921856": _PX + "4921856/pexels-photo-4921856.jpeg?cs=srgb&dl=pexels-ekaterinabelinskaya-4921856.jpg&fm=jpg",
    "5634207": _PX + "5634207/pexels-photo-5634207.jpeg?cs=srgb&dl=pexels-adonyi-foto-5634207.jpg&fm=jpg",
}


def _urls(*photo_ids):
    return [PEXELS_URLS[photo_id] for photo_id in photo_ids]


# Product photo candidates, per stable slug (first one that downloads wins).
# The "detail" (close-up) image of each product is generated from its main
# photo as a zoomed crop, unless you place <slug>-detail.jpg in the cache dir.
PRODUCT_PHOTO_SOURCES = {
    "citrus": _urls("8140790", "1638280"),
    "sunflower": _urls("18751139", "8140790"),
    "dark": _urls("18581553", "30666803"),
    "forest": _urls("30666803", "5247983"),
    "khareshtor": _urls("5247983", "6551047"),
    "blossom": _urls("1638280", "18581553"),
    "mix": _urls("5247982", "8805426"),
}

# Where on the main photo the close-up crop is centred (x, y as 0..1 fractions).
DETAIL_CROP_ANCHORS = {
    "citrus": (0.50, 0.55),
    "sunflower": (0.40, 0.50),
    "dark": (0.55, 0.50),
    "forest": (0.45, 0.60),
    "khareshtor": (0.60, 0.45),
    "blossom": (0.50, 0.40),
    "mix": (0.45, 0.55),
}

# Posters / banners / blog covers. Key -> candidate URLs. The key is also the
# file name (frontend/public/images/posters/<key>.jpg).
POSTER_SOURCES = {
    # general content / media library (also stored as MediaAsset rows)
    "media-hero": _urls("18751139"),
    "media-about": _urls("5247983"),
    "media-blog": _urls("18581553"),
    "media-bee": _urls("5247982"),            # also the intro-video poster
    "media-contact": _urls("8140790"),
    "media-festival": _urls("30666803"),
    # blog covers used by the storefront (frontend/lib/blog.js)
    "blog-spot-fake-honey": _urls("11771949"),
    "blog-storage-tips": _urls("4480158"),
    "blog-crystallization": _urls("8500508"),
    "blog-cooking-with-honey": _urls("11284797"),
    "blog-honey-types": _urls("4921856"),
    "blog-honey-cinnamon": _urls("5634207"),
}

MEDIA_ASSETS = [
    {"key": "media-hero", "label": "بنر صفحه اصلی", "tag": "بنر", "alt_text": "بنر واقعی عسل و ظرف عسل روی میز"},
    {"key": "media-about", "label": "پس‌زمینه درباره ما", "tag": "درباره ما", "alt_text": "تصویر واقعی مرتبط با زنبورداری و تولید عسل"},
    {"key": "media-blog", "label": "کاور وبلاگ — عمومی", "tag": "وبلاگ", "alt_text": "تصویر واقعی عسل برای کاور مقاله"},
    {"key": "media-bee", "label": "آیکون کندوی زنبور", "tag": "زنبورداری", "alt_text": "زنبور و قاب کندو"},
    {"key": "media-festival", "label": "بنر جشنواره بهاره", "tag": "بنر", "alt_text": "تصویر واقعی شیشه عسل برای بنر جشنواره"},
    {"key": "media-contact", "label": "تصویر تماس با ما", "tag": "تماس با ما", "alt_text": "شیشه عسل در چیدمان طبیعی"},
]

BLOG_MEDIA_KEYS = {
    "spot-fake-honey": "media-blog",
    "storage-tips": "media-about",
    "crystallization": "media-bee",
    "cooking-with-honey": "media-contact",
    "honey-types": "media-festival",
    "honey-cinnamon": "media-blog",
}


_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 NikaHoneySeed/2.0"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}


def _download_real_image(source_url, *, timeout=30, max_size=10 * 1024 * 1024, retries=3):
    """Download one photo and return it as optimized JPEG bytes (max 1800px)."""
    payload = None
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            request = Request(source_url, headers=_BROWSER_HEADERS)
            with urlopen(request, timeout=timeout) as response:
                payload = response.read(max_size + 1)
            break
        except Exception as exc:  # network / HTTP errors — retry with backoff
            last_error = exc
            if attempt < retries:
                time.sleep(attempt)
    if payload is None:
        raise CommandError(f"Could not download seed image: {source_url}\n{last_error}") from last_error

    if len(payload) > max_size:
        raise CommandError(f"Seed image is too large (>10MB): {source_url}")

    try:
        source = Image.open(BytesIO(payload)).convert("RGB")
        source.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        out = BytesIO()
        source.save(out, format="JPEG", quality=88, optimize=True)
        return out.getvalue()
    except Exception as exc:
        raise CommandError(f"Downloaded seed asset is not a valid image: {source_url}\n{exc}") from exc


def _make_detail_crop(jpeg_bytes, anchor):
    """A zoomed close-up crop of a photo (used as the product's 2nd image)."""
    try:
        image = Image.open(BytesIO(jpeg_bytes)).convert("RGB")
        width, height = image.size
        side = int(min(width, height) * 0.62)
        center_x, center_y = int(width * anchor[0]), int(height * anchor[1])
        left = max(0, min(width - side, center_x - side // 2))
        top = max(0, min(height - side, center_y - side // 2))
        crop = image.crop((left, top, left + side, top + side))
        crop = crop.resize((1200, 1200), Image.Resampling.LANCZOS)
        out = BytesIO()
        crop.save(out, format="JPEG", quality=88, optimize=True)
        return out.getvalue()
    except Exception:
        return jpeg_bytes  # not a decodable photo (e.g. mocked in tests) — reuse as-is


def _load_local_seed_image(name):
    """Read an image that ships inside the project (offline fallback)."""
    path = SEED_IMAGES_DIR / name
    if not path.is_file():
        raise CommandError(f"Missing bundled seed image: {path}")
    payload = path.read_bytes()
    try:
        Image.open(BytesIO(payload)).verify()
    except Exception as exc:
        raise CommandError(f"Bundled seed image is not a valid image: {path}\n{exc}") from exc
    return payload


def _save_to_frontend(relative_path, payload):
    """Copy a downloaded photo into frontend/public so Next.js serves it from the project."""
    if not FRONTEND_PUBLIC_DIR.is_dir():
        return False
    target = FRONTEND_PUBLIC_DIR / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    return True


def _media_url(file_field):
    value = file_field.url if file_field else ""
    return "/" + value.lstrip("/") if value else ""


class Command(BaseCommand):
    help = (
        "Populate ALL development/demo data (categories, products, users, orders, content, blog) and "
        "download the real product photos + posters into the project."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--refresh",
            action="store_true",
            help="Re-download every photo/poster and replace the seeded images with the new files.",
        )
        parser.add_argument(
            "--offline",
            action="store_true",
            help="Do not download anything: use the files already in the download cache (or the bundled fallbacks).",
        )
        parser.add_argument(
            "--no-uploads",
            action="store_true",
            help=(
                "Do not create ProductImage / MediaAsset rows (files under MEDIA_ROOT). Use this when seeding "
                "a deployed database (e.g. Neon + Render) whose backend has no persistent media storage: the "
                "storefront then uses the static images shipped in frontend/public/images."
            ),
        )
        parser.add_argument(
            "--strict",
            action="store_true",
            help="Fail instead of falling back to bundled illustrations when a download does not work.",
        )

    def handle(self, *args, **options):
        # Downloads run BEFORE the DB transaction so a slow network never holds
        # a database lock, and a failed download can never leave half-seeded rows.
        self.refresh = options["refresh"]
        self.offline = options["offline"]
        self.strict = options["strict"]
        self.no_uploads = options["no_uploads"]
        assets = self._prepare_assets()

        with transaction.atomic():
            category_map = self._seed_categories()
            products_by_slug = self._seed_products(category_map)
            if not self.no_uploads:
                self._seed_product_images(products_by_slug, assets)
            demo_user = self._seed_users()
            self._seed_orders(demo_user, products_by_slug)
            media_map = {} if self.no_uploads else self._seed_media(assets)
            self._seed_content(media_map)
            self._seed_blog(media_map)
            self._seed_settings()
            self._seed_addresses(demo_user)
        self.stdout.write(self.style.SUCCESS("Seed data is up to date."))

    # ------------------------------------------------------------------
    # Photo download / cache layer
    # ------------------------------------------------------------------

    def _fetch_photo(self, key, urls):
        """
        Return (bytes, source) where source is "cache" | "download" | None.
        Order: cached file in the project -> download (first working URL).
        """
        cache_path = ASSETS_CACHE_DIR / f"{key}.jpg"
        if cache_path.is_file() and not self.refresh:
            return cache_path.read_bytes(), "cache"
        if self.offline:
            return None, None
        for url in urls:
            try:
                payload = _download_real_image(url)
            except CommandError as exc:
                self.stderr.write(self.style.WARNING(f"  ! {key}: {str(exc).splitlines()[0]}"))
                continue
            ASSETS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            cache_path.write_bytes(payload)
            self.stdout.write(f"  downloaded: {key} ({len(payload) // 1024} KB)")
            return payload, "download"
        return None, None

    def _prepare_assets(self):
        """
        Download (or reuse from the project cache) every product photo and
        poster, and publish them to frontend/public. Returns
        {"products": {slug: {"primary": bytes, "detail": bytes, "is_photo": bool}},
         "posters": {key: bytes}}.
        """
        products, posters = {}, {}
        missing = []
        published = 0

        for slug, urls in PRODUCT_PHOTO_SOURCES.items():
            primary, source = self._fetch_photo(f"product-{slug}-primary", urls)
            if primary is None:
                missing.append(f"product-{slug}")
                products[slug] = {
                    "primary": _load_local_seed_image(f"{slug}-primary.jpg"),
                    "detail": _load_local_seed_image(f"{slug}-detail.jpg"),
                    "is_photo": False,
                }
                continue

            detail_path = ASSETS_CACHE_DIR / f"product-{slug}-detail.jpg"
            if detail_path.is_file() and not self.refresh:
                detail = detail_path.read_bytes()
            else:
                detail = _make_detail_crop(primary, DETAIL_CROP_ANCHORS[slug])
                ASSETS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
                detail_path.write_bytes(detail)
            products[slug] = {"primary": primary, "detail": detail, "is_photo": True}
            published += _save_to_frontend(f"images/products/{slug}.jpg", primary)
            published += _save_to_frontend(f"images/products/{slug}-detail.jpg", detail)

        for key, urls in POSTER_SOURCES.items():
            payload, source = self._fetch_photo(key, urls)
            if payload is None:
                # Fall back to whatever poster file the frontend already ships.
                placeholder = FRONTEND_PUBLIC_DIR / "images" / "posters" / f"{key}.jpg"
                if placeholder.is_file():
                    payload = placeholder.read_bytes()
                missing.append(key)
                if payload is not None:
                    posters[key] = payload
                continue
            posters[key] = payload
            published += _save_to_frontend(f"images/posters/{key}.jpg", payload)

        if missing and self.strict:
            raise CommandError(
                "Could not download: " + ", ".join(missing) + ". Check your internet connection "
                "(or the URLs at the top of seed_demo.py) and run again."
            )
        if missing:
            self.stderr.write(
                self.style.WARNING(
                    f"  ! {len(missing)} image(s) could not be downloaded and use the bundled fallbacks: "
                    + ", ".join(missing)
                    + ". Run `python manage.py seed_demo` again when the network works "
                    "(use --refresh to force)."
                )
            )
        self.stdout.write(
            self._status_line(
                "photos",
                f"{len(PRODUCT_PHOTO_SOURCES)} products + {len(POSTER_SOURCES)} posters; "
                f"{published} file(s) written to frontend/public/images",
                published > 0,
            )
        )
        return {"products": products, "posters": posters}

    # ------------------------------------------------------------------
    # Categories / products / images
    # ------------------------------------------------------------------

    def _seed_categories(self):
        category_map = {}
        for cat_data in CATEGORIES:
            category, created = Category.objects.update_or_create(
                name=cat_data["name"],
                defaults={"description": cat_data["description"], "is_active": True},
            )
            category_map[cat_data["name"]] = category
            self.stdout.write(self._status_line("category", category.name, created))
        return category_map

    def _seed_products(self, category_map):
        products_by_slug = {}
        for product_data in PRODUCTS:
            category = category_map[product_data["category"]]
            product, created = Product.objects.update_or_create(
                name=product_data["name"],
                defaults={
                    "category": category,
                    "short_description": product_data["short_description"],
                    "description": product_data["description"],
                    "price": product_data["price"],
                    "previous_price": product_data.get("previous_price"),
                    "stock": product_data["stock"],
                    "is_active": True,
                    "is_featured": product_data.get("is_featured", False),
                    "size_value": product_data.get("size_value"),
                    "size_unit": product_data.get("size_unit", ""),
                },
            )
            products_by_slug[product_data["stable_slug"]] = product
            self.stdout.write(self._status_line("product", product.name, created))
        return products_by_slug

    def _seed_product_images(self, products_by_slug, assets):
        """
        Give each seeded product two photos (main + close-up) taken from the
        photos downloaded into the project (see _prepare_assets) and copy
        them into MEDIA_ROOT as ProductImage rows. Staff-managed images are
        never touched. Images from older seed_demo versions (generated
        illustrations / previously downloaded photos) are replaced once by
        the new photos; re-running is a no-op (use --refresh to force).
        """
        created_count = 0
        replaced_count = 0
        for stable_slug, product in products_by_slug.items():
            existing = list(product.images.all())
            asset = assets["products"][stable_slug]

            def _name(image):
                return image.image.name.split("/")[-1] if image.image else ""

            def _is_seed_managed(image):
                name = _name(image)
                return name.startswith(("seed-photo-", "seed-local-", "seed-real-")) or name in {
                    f"{stable_slug}-primary.jpg",
                    f"{stable_slug}-detail.jpg",
                }

            managed = [image for image in existing if _is_seed_managed(image)]

            # Anything else means a staff upload: never overwrite it.
            if len(managed) != len(existing):
                continue
            already_photos = any(_name(image).startswith("seed-photo-") for image in managed)
            if managed and already_photos and not self.refresh:
                continue
            # Download failed this time but the product already has images: keep them.
            if managed and not asset["is_photo"]:
                continue

            for image in managed:
                image.image.delete(save=False)
                image.delete()
                replaced_count += 1

            prefix = "seed-photo" if asset["is_photo"] else "seed-local"
            ProductImage.objects.create(
                product=product,
                image=ContentFile(asset["primary"], name=f"{prefix}-{stable_slug}-primary.jpg"),
                alt_text=f"{product.name} — تصویر اصلی",
                sort_order=0,
                is_primary=True,
            )
            ProductImage.objects.create(
                product=product,
                image=ContentFile(asset["detail"], name=f"{prefix}-{stable_slug}-detail.jpg"),
                alt_text=f"{product.name} — نمای نزدیک",
                sort_order=1,
                is_primary=False,
            )
            created_count += 1

        self.stdout.write(
            self._status_line(
                "product images",
                f"{created_count} product(s) seeded with downloaded photos; {replaced_count} old image(s) replaced",
                created_count > 0 or replaced_count > 0,
            )
        )

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def _seed_users(self):
        demo_email = "demo@nikahoney.local"
        demo_user, created = User.objects.get_or_create(
            email=demo_email, defaults={"full_name": "Demo Customer"}
        )
        if created:
            demo_user.set_password("demo-pass-123")
            demo_user.save()
        self.stdout.write(self._status_line("user", demo_email, created))

        staff_email = "staff@nikahoney.local"
        staff_user, created = User.objects.get_or_create(
            email=staff_email, defaults={"full_name": "Demo Staff", "is_staff": True}
        )
        if created:
            staff_user.set_password("staff-pass-123")
            staff_user.save()
        self.stdout.write(self._status_line("staff user", staff_email, created))

        return demo_user

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------

    def _seed_orders(self, demo_user, products_by_slug):
        """
        One demo order per workflow stage, each with realistic (and
        varied — see DEMO_ORDER_LINES) line items so the staff order list
        isn't the same single line repeated five times. Only created once
        per stage (looked up by a fixed marker in payment_method) so
        re-running the command doesn't keep piling up duplicate orders.
        Totals are computed by the real order-total logic (recalculate_totals),
        never hand-entered, so pricing stays server-authoritative.
        """
        from orders.services import recalculate_totals

        any_created = False
        for status in DEMO_ORDER_STATUSES:
            marker = f"seed-demo:{status}"
            if Order.objects.filter(user=demo_user, payment_method=marker).exists():
                continue

            order = Order.objects.create(
                user=demo_user,
                status=status,
                payment_status=(
                    Order.PaymentStatus.PAID if status != Order.Status.PENDING else Order.PaymentStatus.UNPAID
                ),
                payment_method=marker,
                shipping_address="تهران، خیابان ولیعصر، پلاک ۱",
                contact_phone="09120000000",
            )
            for stable_slug, quantity in DEMO_ORDER_LINES[status]:
                product = products_by_slug[stable_slug]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=quantity,
                )
            recalculate_totals(order)
            any_created = True

        self.stdout.write(
            self._status_line("demo orders", f"{len(DEMO_ORDER_STATUSES)} stage(s)", any_created)
        )

    # ------------------------------------------------------------------
    # Site content (incl. intro video — see content/models.py)
    # ------------------------------------------------------------------

    def _seed_content(self, media_map):
        content = SiteContent.load()
        changed = False

        if not content.hero_title:
            content.hero_title = "عسل طبیعی نیکا"
            content.hero_subtitle = "مستقیم از کندو تا خانه‌ی شما"
            changed = True
        if not content.hero_image_url or content.hero_image_url.startswith("/images/"):
            content.hero_image_url = "/images/posters/media-hero.jpg"
            changed = True
        if not content.topbar_message:
            content.topbar_message = "ارسال رایگان برای خریدهای بالای ۱ میلیون تومان"
            content.topbar_is_active = True
            changed = True
        if not content.contact_email:
            content.contact_email = "info@nikahoney.local"
            changed = True
        if not content.contact_phone:
            content.contact_phone = "021-00000000"
            changed = True
        if not content.contact_address:
            content.contact_address = "تهران، ایران"
            changed = True
        if not content.social_instagram:
            content.social_instagram = "https://instagram.com/nikahoney"
            changed = True
        if not content.social_telegram:
            content.social_telegram = "https://t.me/nikahoney"
            changed = True
        if not content.social_whatsapp:
            content.social_whatsapp = "https://wa.me/989120000000"
            changed = True
        if not content.footer_text:
            content.footer_text = "© عسل نیکا — همه حقوق محفوظ است."
            changed = True
        if not content.promo_message:
            content.promo_message = "جشنواره عسل بهاره آغاز شد!"
            content.promo_is_active = True
            changed = True
        if not content.video_label:
            content.video_label = "نمایش ویدئوی معرفی"
            changed = True
        if not content.video_embed_url or "aqz-KE-bpKQ" in content.video_embed_url:
            content.video_embed_url = "https://www.pexels.com/video/honey-bees-on-a-honeycomb-6872488/"
            changed = True
        if not content.video_poster_image_url or content.video_poster_image_url.startswith("/images/"):
            content.video_poster_image_url = "/images/posters/media-about.jpg"
            changed = True

        if changed:
            content.save()
        self.stdout.write(self._status_line("site content", "storefront + real hero/video media", changed))

    # ------------------------------------------------------------------
    # Blog
    # ------------------------------------------------------------------

    def _seed_blog(self, media_map):
        created_count = 0
        changed_count = 0
        for post_data in BLOG_POSTS:
            media_key = BLOG_MEDIA_KEYS[post_data["slug"]]
            # Static file shipped with the Next.js frontend — works on any host, no media storage needed.
            cover_url = f"/images/posters/{media_key}.jpg"
            post, created = BlogPost.objects.update_or_create(
                slug=post_data["slug"],
                defaults={
                    "title": post_data["title"],
                    "excerpt": post_data["excerpt"],
                    "body": post_data["body"],
                    "tag": post_data["tag"],
                    "author": post_data["author"],
                    "is_published": True,
                    "published_at": post_data["published_at"],
                },
            )
            if created:
                post.cover_image_url = cover_url
                post.save(update_fields=["cover_image_url", "updated_at"])
                created_count += 1
            elif not post.cover_image_url or post.cover_image_url.startswith("/images/blog/"):
                post.cover_image_url = cover_url
                post.save(update_fields=["cover_image_url", "updated_at"])
                changed_count += 1

        self.stdout.write(
            self._status_line(
                "blog posts",
                f"{len(BLOG_POSTS)} post(s), {created_count} created, {changed_count} legacy covers repaired",
                created_count > 0 or changed_count > 0,
            )
        )

    # ------------------------------------------------------------------
    # Media library
    # ------------------------------------------------------------------

    def _seed_media(self, assets):
        """Create/update the general media library from the downloaded posters."""
        media_map = {}
        created_count = 0
        updated_count = 0

        for asset_data in MEDIA_ASSETS:
            key = asset_data["key"]
            payload = assets["posters"].get(key)
            if payload is None:
                raise CommandError(
                    f"Poster '{key}' is not available (download failed and there is no local copy). "
                    "Check your internet connection and run `python manage.py seed_demo` again."
                )
            real_stem = f"seed-real-{key}"
            real_filename = f"{real_stem}.jpg"
            asset = MediaAsset.objects.filter(label=asset_data["label"]).first()

            if asset is None:
                asset = MediaAsset.objects.create(
                    file=ContentFile(payload, name=real_filename),
                    label=asset_data["label"],
                    tag=asset_data["tag"],
                    alt_text=asset_data["alt_text"],
                    is_active=True,
                )
                created_count += 1
            else:
                current_name = asset.file.name.split("/")[-1] if asset.file else ""
                seed_managed = current_name.startswith(("seed-real-", "media-asset", "seed-"))
                already_current = current_name.startswith(real_stem)
                # User-uploaded files (names that don't look like seed files) are preserved.
                if seed_managed and (not already_current or self.refresh):
                    if asset.file:
                        asset.file.delete(save=False)
                    asset.file.save(real_filename, ContentFile(payload), save=False)
                    asset.tag = asset_data["tag"]
                    asset.alt_text = asset_data["alt_text"]
                    asset.is_active = True
                    asset.save()
                    updated_count += 1

            media_map[key] = asset

        self.stdout.write(
            self._status_line(
                "media assets",
                f"{len(MEDIA_ASSETS)} downloaded poster(s), {created_count} created, {updated_count} upgraded",
                created_count > 0 or updated_count > 0,
            )
        )
        return media_map

    # ------------------------------------------------------------------
    # Store settings / address book
    # ------------------------------------------------------------------

    def _seed_settings(self):
        """
        Ensures the StoreSettings singleton exists with sane demo defaults
        (a real flat shipping rate + free-shipping threshold, rather than
        the previous hardcoded-zero placeholder). StoreSettings.load() is
        itself get_or_create, so this is naturally idempotent — but we
        still only set the demo defaults the *first* time the row is
        created, never overwriting values a staff member may have since
        changed via /admin/settings.
        """
        created = not StoreSettings.objects.filter(pk=1).exists()
        settings_obj = StoreSettings.load()
        if created:
            settings_obj.shipping_enabled = True
            settings_obj.shipping_flat_cost = Decimal("45000.00")
            settings_obj.free_shipping_threshold = Decimal("1500000.00")
            settings_obj.guest_checkout_enabled = True
            settings_obj.maintenance_mode = False
            settings_obj.low_stock_threshold = 5
            settings_obj.notify_new_order = True
            settings_obj.notify_low_stock = True
            settings_obj.save()
        self.stdout.write(self._status_line("store settings", "shipping + toggles", created))

    def _seed_addresses(self, demo_user):
        """One deterministic default address for the demo customer, keyed
        by title so re-running the command never duplicates it."""
        created = False
        if not Address.objects.filter(user=demo_user, title="منزل").exists():
            Address.objects.create(
                user=demo_user,
                title="منزل",
                city="ساری",
                detail="خیابان طالقانی، کوچه بهار، پلاک ۱۲",
                postal_code="4816715478",
                is_default=True,
            )
            created = True
        self.stdout.write(self._status_line("demo addresses", "1 address", created))

    # ------------------------------------------------------------------

    def _status_line(self, kind, label, created):
        verb = "created" if created else "already up to date"
        return f"  {kind}: {label} ({verb})"
