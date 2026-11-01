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

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image

from content.models import BlogPost, MediaAsset, SiteContent, StoreSettings
from products.models import Category, Product, ProductImage


CATEGORIES = [
    {"name": "عسل‌ها", "description": "انواع عسل طبیعی"},
    {"name": "ژل رویال و ترکیبات ویژه", "description": "ژل رویال و محصولات ترکیبی ویژه"},
]

# stable_slug: the public URL slug (/product/<slug>). It is stored as Product.slug and
# must match frontend/lib/products.js SLUG_BY_NAME + lib/productsCosmetic.js keys.
PRODUCTS = [
    {
        "name": "عسل کلزا", "stable_slug": "sunflower", "category": "عسل‌ها",
        "short_description": "عسل با منشأ گل‌های زرد کلزا؛ معمولاً روشن‌رنگ با شیرینی ملایم.",
        "description": "## معرفی عسل کلزا\n\nعسل کلزا از شهد گل‌های زرد گیاه کلزا به‌دست می‌آید. رنگ آن معمولاً روشن تا زرد کم‌رنگ و طعم آن ملایم است؛ ویژگی‌های دقیق هر برداشت می‌تواند با منطقه و فصل تغییر کند.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. قیمت پایه هر کیلوگرم: ۱٬۶۰۰٬۰۰۰ تومان. بسته نیم‌کیلویی: ۸۰۰٬۰۰۰ تومان؛ یک‌کیلویی: ۱٬۶۰۰٬۰۰۰ تومان؛ دوکیلویی: ۳٬۲۰۰٬۰۰۰ تومان. برای وزن‌های بالاتر هماهنگی تلفنی انجام می‌شود.\n\n## نگهداری\n\nدر ظرف دربسته، دور از رطوبت، نور مستقیم و گرمای زیاد نگهداری شود. بلوره‌شدن ممکن است طبیعی باشد و به‌تنهایی اثبات‌کننده خلوص یا تقلب نیست. به کودکان زیر یک سال عسل ندهید. این محصول غذاست و جایگزین درمان پزشکی نیست.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["Brassica napus rapeseed yellow flowers honey bee", "rapeseed field yellow flowers bee", "rapeseed honey jar"],
    },
    {
        "name": "عسل جنگل (نمدار)", "stable_slug": "forest", "category": "عسل‌ها",
        "short_description": "عسل با منشأ گل‌های نمدار؛ رایحه گیاهی و گل‌مانند، بسته به برداشت.",
        "description": "## معرفی عسل جنگل (نمدار)\n\nعسل نمدار از شهد گل‌های درختان نمدار (Tilia) به‌دست می‌آید. در منابع توصیفی، رایحه گل‌مانند و گیاهی و طعمی شیرین با گاهی پس‌مزه گیاهی برای آن گزارش شده است؛ رنگ، شدت رایحه و بافت با گونه درخت و شرایط برداشت تفاوت دارد. نام «جنگل» به‌تنهایی تضمین نمی‌کند که عسل کاملاً تک‌گل باشد.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. هر کیلوگرم ۱٬۶۰۰٬۰۰۰ تومان؛ نیم‌کیلو ۸۰۰٬۰۰۰ تومان؛ یک کیلو ۱٬۶۰۰٬۰۰۰ تومان؛ دو کیلو ۳٬۲۰۰٬۰۰۰ تومان. وزن‌های بالاتر با هماهنگی قابل سفارش‌اند.\n\nدر جای خشک و خنک و ظرف دربسته نگهداری شود. به کودکان زیر یک سال عسل ندهید. ادعای درمانی برای این محصول مطرح نمی‌شود.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["Tilia linden tree flowers honey bee", "linden blossom Tilia flowers", "linden honey in glass jar"],
    },
    {
        "name": "عسل مرکبات", "stable_slug": "citrus", "category": "عسل‌ها",
        "short_description": "عسل با منشأ شکوفه مرکبات؛ معمولاً رایحه گل‌مانند و مرکباتی.",
        "description": "## معرفی عسل مرکبات\n\nعسل مرکبات از شهد شکوفه درختانی مانند پرتقال، لیمو و نارنگی به‌دست می‌آید. عسل‌های این گروه اغلب رایحه‌ای گل‌مانند و لطیف دارند و رنگ آن‌ها می‌تواند از روشن تا کهربایی متغیر باشد. ویژگی نهایی به نوع مرکبات و شرایط منطقه و برداشت بستگی دارد.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. هر کیلوگرم ۱٬۶۰۰٬۰۰۰ تومان؛ نیم‌کیلو ۸۰۰٬۰۰۰ تومان؛ یک کیلو ۱٬۶۰۰٬۰۰۰ تومان؛ دو کیلو ۳٬۲۰۰٬۰۰۰ تومان. برای سفارش‌های حجیم‌تر تماس بگیرید.\n\nدر ظرف دربسته، دور از نور مستقیم و رطوبت نگهداری شود. به کودکان زیر یک سال عسل ندهید.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["citrus orange blossom flowers honey bee", "orange tree blossom close up", "citrus honey jar orange blossom"],
    },
    {
        "name": "عسل سیاه تلو", "stable_slug": "dark", "category": "عسل‌ها",
        "short_description": "عسل با نام محلی سیاه تلو؛ رنگ و طعم دقیق وابسته به منشأ و برداشت است.",
        "description": "## معرفی عسل سیاه تلو\n\n«سیاه تلو» نامی محلی برای این محصول است. چون نام‌های محلی گیاهان ممکن است در مناطق مختلف به گونه‌های متفاوت اشاره کنند، بدون تأیید زنبوردار یا شناسایی گیاه نمی‌توان منشأ گیاه‌شناسی، رنگ یا ترکیب دقیق این عسل را قطعی اعلام کرد. این معرفی از نسبت‌دادن خواص درمانی اثبات‌نشده خودداری می‌کند.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. هر کیلوگرم ۱٬۶۰۰٬۰۰۰ تومان؛ نیم‌کیلو ۸۰۰٬۰۰۰ تومان؛ یک کیلو ۱٬۶۰۰٬۰۰۰ تومان؛ دو کیلو ۳٬۲۰۰٬۰۰۰ تومان. بسته‌بندی‌های بزرگ‌تر با هماهنگی تلفنی.\n\nدر جای خشک و خنک و ظرف دربسته نگهداری شود. به کودکان زیر یک سال عسل ندهید.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["Iran wildflower honey bee flowers dark honey", "wild honey bee forage flowers", "dark honey in glass jar"],
    },
    {
        "name": "عسلک ترنجبین", "stable_slug": "blossom", "category": "عسل‌ها",
        "short_description": "عسلک ترنجبین؛ محصولی متمایز از عسل شهد گل و وابسته به منبع عسلک.",
        "description": "## معرفی عسلک ترنجبین\n\nعسلک با عسل گل تفاوت دارد: زنبورها می‌توانند مواد شیرین عسلکِ حاصل از ترشحات گیاه یا حشرات مکنده شیره گیاه را جمع‌آوری کنند. عسلک‌ها بسته به منشأ می‌توانند رنگ تیره‌تر و ترکیب قندی و معدنی متفاوتی از عسل‌های شهدی داشته باشند. برای نسبت‌دادن ترکیب دقیق این محصول به ترنجبین، تأیید منشأ محموله اهمیت دارد.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. هر کیلوگرم ۱٬۶۰۰٬۰۰۰ تومان؛ نیم‌کیلو ۸۰۰٬۰۰۰ تومان؛ یک کیلو ۱٬۶۰۰٬۰۰۰ تومان؛ دو کیلو ۳٬۲۰۰٬۰۰۰ تومان. وزن‌های بالاتر با هماهنگی قابل سفارش است.\n\nدر ظرف دربسته و دور از گرما و رطوبت نگهداری شود. به کودکان زیر یک سال عسل ندهید.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["Tamarisk manna honeydew honey plant", "honeydew secretion plant close up", "honeydew honey dark amber jar"],
    },
    {
        "name": "عسل آفتابگردان", "stable_slug": "sunflower-honey", "category": "عسل‌ها",
        "short_description": "عسل با منشأ گل آفتابگردان؛ رنگ و سرعت بلوره‌شدن وابسته به ترکیب قندی است.",
        "description": "## معرفی عسل آفتابگردان\n\nعسل آفتابگردان از شهد گل‌های آفتابگردان به‌دست می‌آید. رنگ آن می‌تواند زرد روشن تا کهربایی باشد و در برخی نمونه‌ها بلوره‌شدن نسبتاً زود رخ می‌دهد؛ این رفتار به ترکیب قندی و شرایط نگهداری وابسته است. رنگ و سرعت بلوره‌شدن به‌تنهایی معیار قطعی اصالت نیستند.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۵۰۰ گرم است (۸۰۰٬۰۰۰ تومان)؛ برای یک کیلو تعداد ۲ و برای دو کیلو تعداد ۴ را انتخاب کنید. هر کیلوگرم ۱٬۶۰۰٬۰۰۰ تومان؛ نیم‌کیلو ۸۰۰٬۰۰۰ تومان؛ یک کیلو ۱٬۶۰۰٬۰۰۰ تومان؛ دو کیلو ۳٬۲۰۰٬۰۰۰ تومان. برای وزن‌های بالاتر تماس بگیرید.\n\nدر ظرف دربسته و دور از نور مستقیم نگهداری شود. به کودکان زیر یک سال عسل ندهید.",
        "price": Decimal("800000"), "stock": 40, "size_value": Decimal("500"), "size_unit": "g",
        "image_queries": ["Helianthus annuus sunflower field honey bee", "sunflower head bee close up", "sunflower honey jar golden"],
    },
    {
        "name": "ژل رویال", "stable_slug": "royal-jelly", "category": "ژل رویال و ترکیبات ویژه",
        "short_description": "ژل رویال تازه؛ قیمت هر گرم ۶۰٬۰۰۰ تومان؛ بسته‌های ۱۰، ۱۵، ۵۰ و ۱۰۰ گرمی.",
        "description": "## معرفی ژل رویال\n\nژل رویال ماده‌ای ترشح‌شده از زنبورهای کارگر است که در تغذیه لاروها و ملکه نقش دارد. این محصول با عسل متفاوت است و شرایط نگهداری آن باید مطابق دستور تولیدکننده و زنجیره سردِ مناسب محصول باشد. از ادعاهای درمانی قطعی بدون شواهد معتبر پرهیز می‌کنیم.\n\n## بسته‌بندی و قیمت\n\nواحد فروش در سایت ۱۰ گرم است؛ برای ۵۰ گرم تعداد ۵ و برای ۱۰۰ گرم تعداد ۱۰ را انتخاب کنید. بسته ۱۵ گرمی با هماهنگی تلفنی ارسال می‌شود. قیمت هر گرم ژل رویال ۶۰٬۰۰۰ تومان است.\n\n- بسته ۱۰ گرمی: ۶۰۰٬۰۰۰ تومان\n- بسته ۱۵ گرمی: ۹۰۰٬۰۰۰ تومان\n- بسته ۵۰ گرمی: ۳٬۰۰۰٬۰۰۰ تومان\n- بسته ۱۰۰ گرمی: ۶٬۰۰۰٬۰۰۰ تومان\n\nاین قیمت‌ها بر اساس نرخ اعلام‌شده هر گرم محاسبه شده‌اند.\n\n## نگهداری و احتیاط\n\nژل رویال باید مطابق شرایط اعلام‌شده از سوی عرضه‌کننده و با رعایت زنجیره سردِ مناسب نگهداری شود. افراد دارای حساسیت به فرآورده‌های زنبورعسل یا آسم باید پیش از مصرف احتیاط کنند؛ در صورت بروز واکنش حساسیتی مصرف را متوقف کرده و کمک پزشکی بگیرند.",
        "price": Decimal("600000"), "stock": 40, "size_value": Decimal("10"), "size_unit": "g", "is_featured": True, "is_active": True,
        "image_queries": ["fresh royal jelly in glass dish", "royal jelly honey bee close up", "royal jelly product jar white cream"],
    },
]

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
    {
        "slug": "honey-and-infants",
        "title": "چرا به نوزاد زیر یک سال عسل نمی‌دهیم؟",
        "tag": "ایمنی",
        "author": "تیم نیکا",
        "cover_image_url": "",
        "excerpt": "توصیه‌ی پزشکی برای نوزادان زیر ۱۲ ماه چیست و چرا حتی یک چشیدن کوچک هم توصیه نمی‌شود؟",
        "published_at": datetime(2026, 9, 10, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## توصیه‌ی روشن پزشکی\n\n"
            "عسل برای کودکان بزرگ‌تر و بزرگسالان غذای رایجی است، اما مراجع بهداشتی و "
            "کودکان توصیه می‌کنند به نوزاد زیر ۱۲ ماه هیچ نوع عسل داده نشود. این توصیه "
            "درباره‌ی عسل خانگی، صنعتی و حتی عسلی که روی پستانک مالیده می‌شود یکسان است.\n\n"
            "## دلیل چیست؟\n\n"
            "عسل ممکن است حاوی اسپورهای خفته‌ی باکتری «کلستریدیوم بوتولینوم» باشد. در "
            "روده‌ی بالغ‌تر کودکان بزرگ‌تر و بزرگسالان این اسپورها معمولاً فعال نمی‌شوند، "
            "اما در روده‌ی نارس نوزاد می‌توانند جوانه بزنند و سمی تولید کنند که اعصاب را "
            "تحت‌تأثیر قرار می‌دهد. این بیماری «بوتولیسم نوزادی» نام دارد؛ نادر است، "
            "ولی جدی است.\n\n"
            "## عسل تنها منبع نیست\n\n"
            "اسپورهای این باکتری در خاک و گردوغبار هم وجود دارند، بنابراین عسل تنها "
            "منبع احتمالی نیست. با این حال عسل منبعی است که می‌توان به‌سادگی از آن "
            "پرهیز کرد؛ به همین دلیل توصیه‌ی «عسل ندهید» تا پایان یک‌سالگی ثابت مانده است.\n\n"
            "## نکات عملی برای خانواده‌ها\n\n"
            "عسل را به آب، شیرخشک، فرنی یا غذای نوزاد اضافه نکنید و پستانک را در عسل "
            "نزنید. شیر مادر بوتولیسم را منتقل نمی‌کند؛ مادری که عسل می‌خورد نگران "
            "انتقال آن از راه شیر نیست. پس از ۱۲ ماهگی، برای کودکان سالم این محدودیت "
            "معمولاً برداشته می‌شود؛ اگر سابقه‌ی بیماری یا حساسیت خاصی دارید، با پزشک "
            "کودک مشورت کنید.\n\n"
            "## چه زمانی باید فوراً به پزشک مراجعه کرد؟\n\n"
            "یبوست تازه، گریه‌ی ضعیف، مکیدن ضعیف، افتادگی پلک، شل‌بودن بدن، از دست "
            "دادن کنترل سر یا مشکل تنفسی در نوزاد نشانه‌هایی‌اند که باید فوری بررسی شوند.\n\n"
            "## منابع\n\n"
            "UF/IFAS Extension — Infant Botulism and Honey: https://ask.ifas.ufl.edu/publication/aa142\n\n"
            "Michigan State University Extension — Babies and honey don't go together: https://www.canr.msu.edu/news/babies_and_honey_dont_go_together\n\n"
            "Poison Control — Don't feed honey to infants: https://www.poison.org/articles/dont-feed-honey-to-infants\n\n"
            "این مطلب جنبه‌ی آموزشی دارد و جایگزین مشاوره‌ی پزشک نیست."
        ),
    },
    {
        "slug": "royal-jelly-guide",
        "title": "ژل رویال چیست و پیش از مصرف چه نکاتی را باید بدانیم؟",
        "tag": "راهنما",
        "author": "تیم نیکا",
        "cover_image_url": "",
        "excerpt": "معرفی ژل رویال، نکات نگهداری و هشدارهای مهم درباره‌ی حساسیت و مصرف همراه با دارو.",
        "published_at": datetime(2026, 9, 24, 9, 0, tzinfo=dt_timezone.utc),
        "body": (
            "## ژل رویال چیست؟\n\n"
            "ژل رویال ماده‌ای شیری‌رنگ و غنی است که زنبورهای کارگر ترشح می‌کنند و "
            "تغذیه‌ی لاروهای جوان و ملکه‌ی کندو با آن انجام می‌شود. این ماده با عسل "
            "تفاوت دارد و شرایط نگهداری و مصرفش هم متفاوت است.\n\n"
            "## درباره‌ی «خواص» چه باید گفت؟\n\n"
            "برای ژل رویال ادعاهای زیادی مطرح می‌شود، اما منابع پزشکی معتبر می‌گویند "
            "اثربخشی آن برای درمان بیماری‌ها قطعی نشده و نباید جای داروی تجویزشده را "
            "بگیرد. به همین دلیل در نیکا برای این محصول ادعای درمانی مطرح نمی‌کنیم و "
            "آن را به‌عنوان یک فرآورده‌ی زنبورعسل معرفی می‌کنیم.\n\n"
            "## مهم‌ترین هشدار: حساسیت\n\n"
            "ژل رویال یک فرآورده‌ی زنبورعسل است و ممکن است واکنش آلرژیک ایجاد کند؛ "
            "از کهیر و خارش پوست تا مشکلات تنفسی و، در موارد نادر، واکنش شدید. "
            "افراد دارای آسم، حساسیت‌های فصلی یا اگزما و کسانی که به محصولات "
            "زنبورعسل (گرده، پروپولیس، نیش زنبور) حساسیت دارند، در معرض خطر بیشتری هستند. "
            "گزارش‌هایی هست که واکنش در همان اولین مصرف هم رخ داده است. در صورت "
            "کهیر، تورم لب و صورت یا تنگی نفس، مصرف را قطع کنید و فوراً کمک پزشکی بگیرید.\n\n"
            "## چه کسانی باید حتماً با پزشک مشورت کنند؟\n\n"
            "زنان باردار و شیرده (شواهد کافی برای اطمینان از ایمنی وجود ندارد)، "
            "افرادی که داروهای رقیق‌کننده‌ی خون مثل وارفارین یا داروی فشار خون "
            "مصرف می‌کنند، و هر کسی که بیماری زمینه‌ای دارد، پیش از شروع مصرف باید "
            "با پزشک یا داروساز صحبت کند.\n\n"
            "## نگهداری\n\n"
            "ژل رویال را مطابق دستور روی بسته‌بندی و با رعایت زنجیره‌ی سرد "
            "(معمولاً در یخچال) نگه دارید، در ظرف دربسته و دور از نور و گرما. "
            "از آلوده‌کردن ظرف با قاشق خیس خودداری کنید.\n\n"
            "## منابع\n\n"
            "Frontiers/PMC — Royal jelly allergy review: https://pmc.ncbi.nlm.nih.gov/articles/PMC7266330\n\n"
            "University of Michigan Health — Royal jelly: https://uofmhealth.org/health-library/d04481a1\n\n"
            "Memorial Sloan Kettering — Royal Jelly: https://mskcc.org/pdf/cancer-care/patient-education/herbs/royal-jelly\n\n"
            "این مطلب جنبه‌ی آموزشی دارد و جایگزین مشاوره‌ی پزشک نیست."
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
    "sunflower-primary": "https://commons.wikimedia.org/wiki/Special:FilePath/Apis_mellifera_-_Brassica_napus_-_Valingu.jpg",
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
    "honey-and-infants": "media-about",
    "royal-jelly-guide": "media-contact",
}


def _download_real_image(source_url, *, timeout=30, max_size=10 * 1024 * 1024):
    request = Request(source_url, headers={"User-Agent": "NikaHoneySeed/1.0"})
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = response.read(max_size + 1)
    except Exception as exc:
        raise CommandError(
            f"Could not download seed image: {source_url}\n{exc}\n"
            "Hint: the seed needs internet access to Wikimedia Commons / Pexels. "
            "If these sites are blocked on your network, run it through a VPN or set "
            "HTTPS_PROXY / HTTP_PROXY first."
        ) from exc

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
    """Return the public URL of a stored file.

    Local FileSystemStorage gives a root-relative path ("/media/x.jpg"); an
    S3/R2 backend gives an absolute https URL which must be kept as-is.
    """
    value = file_field.url if file_field else ""
    if not value:
        return ""
    if value.startswith(("http://", "https://")):
        return value
    return "/" + value.lstrip("/")


class Command(BaseCommand):
    help = "Populate ALL development/demo data (categories, products, images, users, orders, content, blog)."

    @transaction.atomic
    def add_arguments(self, parser):
        parser.add_argument(
            "--require-images", action="store_true",
            help="Abort if any product ends up with fewer than 3 photos (default: warn and continue "
                 "so products/content are still created).",
        )

    def handle(self, *args, **options):
        self.require_images = options.get("require_images", False)
        category_map = self._seed_categories()
        products_by_slug = self._seed_products(category_map)
        self._seed_product_images(products_by_slug)
        media_map = self._seed_media()
        self._seed_content(media_map)
        self._seed_blog(media_map)
        self._seed_settings()
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
            public_slug = product_data["stable_slug"]
            # Public URL slug == stable_slug (matches frontend/lib/products.js).
            # Free it first if an older, differently named product holds it.
            Product.objects.filter(slug=public_slug).exclude(name=product_data["name"]).update(
                slug=f"{public_slug}-legacy"
            )
            product, created = Product.objects.update_or_create(
                name=product_data["name"],
                defaults={
                    "slug": public_slug,
                    "category": category,
                    "short_description": product_data["short_description"],
                    "description": product_data["description"],
                    "price": product_data["price"],
                    "previous_price": product_data.get("previous_price"),
                    "stock": product_data["stock"],
                    "is_active": product_data.get("is_active", True),
                    "is_featured": product_data.get("is_featured", False),
                    "size_value": product_data.get("size_value"),
                    "size_unit": product_data.get("size_unit", ""),
                },
            )
            products_by_slug[product_data["stable_slug"]] = product
            self.stdout.write(self._status_line("product", product.name, created))
        return products_by_slug

    def _seed_product_images(self, products_by_slug):
        """Download 3–6 locally stored, product-specific photos from Wikimedia Commons.

        Images are searched by botanical/product name, not reused randomly across products.
        Existing staff-managed images are preserved. A few distinct counts are intentionally
        used to give product galleries 3–6 images. Wikimedia API/source URLs are stored in
        the accompanying image-source report after each run.
        """
        import json
        import random
        from urllib.parse import urlencode

        image_counts = {"sunflower": 5, "forest": 4, "citrus": 6, "dark": 5,
                        "blossom": 4, "sunflower-honey": 6, "royal-jelly": 3}
        query_map = {item["stable_slug"]: item.get("image_queries", []) for item in PRODUCTS}
        report = []
        for stable_slug, product in products_by_slug.items():
            existing = list(product.images.all())
            if existing:
                # Seed-managed images are replaceable; staff-uploaded images remain untouched.
                seed_managed = [im for im in existing if im.image and im.image.name.split("/")[-1].startswith("seed-real-")]
                if not seed_managed:
                    continue
                for im in seed_managed:
                    im.image.delete(save=False)
                    im.delete()

            queries = query_map.get(stable_slug, [])
            target_count = image_counts.get(stable_slug, 3)
            candidates, seen = [], set()
            for query in queries:
                api = "https://commons.wikimedia.org/w/api.php?" + urlencode({
                    "action": "query", "format": "json", "generator": "search",
                    "gsrsearch": "filetype:bitmap " + query, "gsrnamespace": 6,
                    "gsrlimit": 12, "prop": "imageinfo", "iiprop": "url|extmetadata",
                    "iiurlwidth": 1400,
                })
                try:
                    request = Request(api, headers={"User-Agent": "NikaHoneySeed/1.0 (product catalog image attribution)"})
                    with urlopen(request, timeout=20) as response:
                        payload = json.loads(response.read(2 * 1024 * 1024).decode("utf-8"))
                    for page in payload.get("query", {}).get("pages", {}).values():
                        info = (page.get("imageinfo") or [{}])[0]
                        url = info.get("thumburl") or info.get("url")
                        if not url or url in seen:
                            continue
                        title = page.get("title", "")
                        # Exclude SVG/logo/diagram and avoid unrelated image types.
                        if not url.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png", ".webp")):
                            continue
                        meta = info.get("extmetadata", {})
                        candidates.append({"url": url, "title": title,
                                           "license": meta.get("LicenseShortName", {}).get("value", "Unknown"),
                                           "artist": meta.get("Artist", {}).get("value", "Unknown"),
                                           "source": "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_")})
                        seen.add(url)
                except Exception as exc:
                    self.stdout.write(self.style.WARNING(f"Image search skipped for {query}: {exc}"))
                if len(candidates) >= target_count * 2:
                    break
            if len(candidates) < 3:
                msg = f"Could not find at least 3 relevant images for {product.name}. Check internet access or Wikimedia Commons search terms."
                if self.require_images:
                    raise CommandError(msg)
                self.stdout.write(self.style.WARNING(msg + " — continuing without photos for this product."))
                continue
            # Deterministic variety: no random reordering between runs.
            selected = candidates[:target_count]
            for idx, item in enumerate(selected):
                try:
                    payload = _download_real_image(item["url"])
                except CommandError as exc:
                    self.stdout.write(self.style.WARNING(str(exc)))
                    continue
                ProductImage.objects.create(
                    product=product,
                    image=ContentFile(payload, name=f"seed-real-{stable_slug}-{idx+1}.jpg"),
                    alt_text=f"{product.name} — تصویر مرتبط {idx+1}",
                    sort_order=idx,
                    is_primary=(idx == 0),
                )
                report.append({"product": product.name, "source_url": item["source"],
                               "file_title": item["title"], "license": item["license"],
                               "artist": item["artist"]})
            if product.images.count() < 3:
                msg = f"Fewer than 3 images were downloaded for {product.name}."
                if self.require_images:
                    raise CommandError(msg + " Seed stopped rather than publishing an incomplete gallery.")
                self.stdout.write(self.style.WARNING(msg + " Re-run seed_demo later to fill the gallery."))
            self.stdout.write(self._status_line("product images", f"{product.name}: {product.images.count()} local images", True))

        try:
            with open("seed-image-sources.json", "w", encoding="utf-8") as handle:
                json.dump(report, handle, ensure_ascii=False, indent=2)
        except OSError:
            pass

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
        if not content.topbar_message or "۱ میلیون" in content.topbar_message:
            content.topbar_message = "ارسال رایگان برای خریدهای بالای ۱٫۵ میلیون تومان"
            content.topbar_is_active = True
            changed = True
        # Canonical Nika Honey contact details: deliberately re-applied on
        # every seed_demo run so the site/API/admin content stays in sync.
        contact_defaults = {
            "contact_email": "info@nikahoney.ir",
            "contact_phone": "09365522762",
            "contact_address": "استان گلستان، شهرستان کلاله، روستای یاساقلق",
            "social_instagram": "https://www.instagram.com/Nika_honey1/",
            "social_telegram": "https://t.me/Nika_honey1",
            # WhatsApp links use the phone number; @handles are not a reliable
            # universal WhatsApp destination.
            "social_whatsapp": "https://wa.me/989365522762",
            "social_rubika": "https://rubika.ir/Nika_honey1",
        }
        for field, value in contact_defaults.items():
            if getattr(content, field) != value:
                setattr(content, field, value)
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

    def _status_line(self, kind, label, created):
        verb = "created" if created else "already up to date"
        return f"  {kind}: {label} ({verb})"
