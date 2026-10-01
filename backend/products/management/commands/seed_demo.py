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

from datetime import datetime, timezone as dt_timezone
from decimal import Decimal
from io import BytesIO
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


# Real public Pexels photography used by seed_demo.
# The command downloads, validates, converts and stores these images locally in
# Django MEDIA_ROOT so ProductImage / MediaAsset records point at real local
# files instead of broken static placeholders or remote hotlinks.
REAL_IMAGE_SOURCES = {
    # Product photography (all honey-focused)
    "citrus-primary": "https://images.pexels.com/photos/18751139/pexels-photo-18751139.png?cs=srgb&dl=pexels-fernanda-nunez-760836228-18751139.jpg&fm=jpg",
    "citrus-detail": "https://images.pexels.com/photos/10819687/pexels-photo-10819687.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "sunflower-primary": "https://images.pexels.com/photos/8500508/pexels-photo-8500508.jpeg?cs=srgb&dl=pexels-alexfalconer-8500508.jpg&fm=jpg",
    "sunflower-detail": "https://images.pexels.com/photos/8140790/pexels-photo-8140790.jpeg?cs=srgb&dl=pexels-micheile-8140790.jpg&fm=jpg",
    "dark-primary": "https://images.pexels.com/photos/7990484/pexels-photo-7990484.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "dark-detail": "https://images.pexels.com/photos/30666803/pexels-photo-30666803.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "forest-primary": "https://images.pexels.com/photos/18581552/pexels-photo-18581552.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "forest-detail": "https://images.pexels.com/photos/12370134/pexels-photo-12370134.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "khareshtor-primary": "https://images.pexels.com/photos/35042437/pexels-photo-35042437.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "khareshtor-detail": "https://images.pexels.com/photos/35042436/pexels-photo-35042436.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "blossom-primary": "https://images.pexels.com/photos/18581553/pexels-photo-18581553.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "blossom-detail": "https://images.pexels.com/photos/18751139/pexels-photo-18751139.png?cs=srgb&dl=pexels-fernanda-nunez-760836228-18751139.jpg&fm=jpg",
    "mix-primary": "https://images.pexels.com/photos/10819687/pexels-photo-10819687.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "mix-detail": "https://images.pexels.com/photos/12370134/pexels-photo-12370134.jpeg?auto=compress&cs=tinysrgb&w=1600",

    # General content/media library photography
    "media-hero": "https://images.pexels.com/photos/18751139/pexels-photo-18751139.png?cs=srgb&dl=pexels-fernanda-nunez-760836228-18751139.jpg&fm=jpg",
    "media-about": "https://images.pexels.com/photos/5247983/pexels-photo-5247983.jpeg?cs=srgb&dl=pexels-anete-lusina-5247983.jpg&fm=jpg",
    "media-blog": "https://images.pexels.com/photos/18581553/pexels-photo-18581553.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "media-bee": "https://images.pexels.com/photos/5247982/pexels-photo-5247982.jpeg?cs=srgb&dl=pexels-anete-lusina-5247982.jpg&fm=jpg",
    "media-contact": "https://images.pexels.com/photos/8140790/pexels-photo-8140790.jpeg?cs=srgb&dl=pexels-micheile-8140790.jpg&fm=jpg",
    "media-festival": "https://images.pexels.com/photos/30666803/pexels-photo-30666803.jpeg?auto=compress&cs=tinysrgb&w=1600",
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


def _download_real_image(source_url, *, timeout=30, max_size=10 * 1024 * 1024):
    request = Request(source_url, headers={"User-Agent": "NikaHoneySeed/1.0"})
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = response.read(max_size + 1)
    except Exception as exc:
        raise CommandError(f"Could not download seed image: {source_url}\n{exc}") from exc

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


def _media_url(file_field):
    value = file_field.url if file_field else ""
    return "/" + value.lstrip("/") if value else ""


class Command(BaseCommand):
    help = "Populate ALL development/demo data (categories, products, images, users, orders, content, blog)."

    @transaction.atomic
    def handle(self, *args, **options):
        category_map = self._seed_categories()
        products_by_slug = self._seed_products(category_map)
        self._seed_product_images(products_by_slug)
        demo_user = self._seed_users()
        self._seed_orders(demo_user, products_by_slug)
        media_map = self._seed_media()
        self._seed_content(media_map)
        self._seed_blog(media_map)
        self._seed_settings()
        self._seed_addresses(demo_user)
        self.stdout.write(self.style.SUCCESS("Seed data is up to date."))

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

    def _seed_product_images(self, products_by_slug):
        """
        Give each seeded product two real local photos downloaded from public
        Pexels sources. Existing staff-managed images are preserved. Legacy
        placeholder images created by older seed_demo versions are replaced.
        """
        created_count = 0
        replaced_count = 0
        for stable_slug, product in products_by_slug.items():
            existing = list(product.images.all())
            legacy = [
                image for image in existing
                if image.image and image.image.name.split("/")[-1] in {
                    f"{stable_slug}-primary.jpg",
                    f"{stable_slug}-detail.jpg",
                }
            ]

            # If real/non-seed images already exist, never overwrite them.
            non_legacy = [image for image in existing if image not in legacy]
            if non_legacy:
                continue

            if not existing or legacy:
                for image in legacy:
                    image.image.delete(save=False)
                    image.delete()
                    replaced_count += 1

                primary_key = f"{stable_slug}-primary"
                detail_key = f"{stable_slug}-detail"
                primary_bytes = _download_real_image(REAL_IMAGE_SOURCES[primary_key])
                detail_bytes = _download_real_image(REAL_IMAGE_SOURCES[detail_key])

                ProductImage.objects.create(
                    product=product,
                    image=ContentFile(primary_bytes, name=f"seed-real-{stable_slug}-primary.jpg"),
                    alt_text=f"{product.name} — تصویر اصلی",
                    sort_order=0,
                    is_primary=True,
                )
                ProductImage.objects.create(
                    product=product,
                    image=ContentFile(detail_bytes, name=f"seed-real-{stable_slug}-detail.jpg"),
                    alt_text=f"{product.name} — نمای نزدیک",
                    sort_order=1,
                    is_primary=False,
                )
                created_count += 1

        self.stdout.write(
            self._status_line(
                "product images",
                f"{created_count} product(s) seeded with real photos; {replaced_count} legacy placeholder(s) replaced",
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
            content.hero_image_url = _media_url(media_map["media-hero"].file)
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
            content.video_poster_image_url = _media_url(media_map["media-about"].file)
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
            cover_url = _media_url(media_map[media_key].file)
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

    def _seed_media(self):
        """Create/update deterministic general media with real local files."""
        media_map = {}
        created_count = 0
        updated_count = 0

        for asset_data in MEDIA_ASSETS:
            key = asset_data["key"]
            real_filename = f"seed-real-{key}.jpg"
            asset = MediaAsset.objects.filter(label=asset_data["label"]).first()
            desired_bytes = None

            if asset is None:
                desired_bytes = _download_real_image(REAL_IMAGE_SOURCES[key])
                asset = MediaAsset.objects.create(
                    file=ContentFile(desired_bytes, name=real_filename),
                    label=asset_data["label"],
                    tag=asset_data["tag"],
                    alt_text=asset_data["alt_text"],
                    is_active=True,
                )
                created_count += 1
            else:
                current_name = asset.file.name.split("/")[-1] if asset.file else ""
                if current_name.startswith("seed-real-") or current_name.startswith("media-asset") or current_name.startswith("seed-"):
                    # Existing seed-generated/demo media can be safely upgraded
                    # to the real-photo files. User-uploaded files are preserved
                    # when their names do not match a known seed-generated file.
                    if current_name != real_filename:
                        desired_bytes = _download_real_image(REAL_IMAGE_SOURCES[key])
                        if asset.file:
                            asset.file.delete(save=False)
                        asset.file.save(real_filename, ContentFile(desired_bytes), save=False)
                        asset.tag = asset_data["tag"]
                        asset.alt_text = asset_data["alt_text"]
                        asset.is_active = True
                        asset.save()
                        updated_count += 1

            media_map[key] = asset

        self.stdout.write(
            self._status_line(
                "media assets",
                f"{len(MEDIA_ASSETS)} real asset(s), {created_count} created, {updated_count} upgraded",
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
