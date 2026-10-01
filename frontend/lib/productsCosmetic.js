// متادیتای «تزئینی» محصولات: تصویر، ایموجی، تگ‌لاین، بنفیت‌ها، بج و ...
// این‌ها در بک‌اند جنگو وجود ندارند (و نباید هم وجود داشته باشند — این‌ها
// محتوای بازاریابی/طراحی‌اند، نه داده‌ی تجاری). قیمت/موجودی/فعال‌بودن/دسته‌بندی
// این فایل صرفاً به‌عنوان مقدار پیش‌فرض/دمو استفاده می‌شوند و همیشه با مقادیر
// واقعی از GET /products/ در lib/products.js بازنویسی می‌شوند.
// کلید هر رکورد همان اسلاگ پایدار مسیر عمومی (/product/[slug]) است که با
// نام محصول در بک‌اند (seed_demo.py) نگاشت می‌شود — نگاشت در lib/products.js.

// Single source of truth for product data — used by the home, shop, cart, and product pages.
export const COSMETIC_PRODUCTS = {
  "citrus": {
    "category": "عسل‌ها",
    "title": "عسل مرکبات",
    "tagline": "ملایم، معطر و سرشار از انرژی",
    "emoji": "🍊",
    "price": "۲۴۰,۰۰۰",
    "weight": "۴۵۰ گرم",
    "badge": "پرفروش",
    "origin": "باغات مرکبات مازندران",
    "harvest": "بهار",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/18751139/pexels-photo-18751139.png?cs=srgb&dl=pexels-fernanda-nunez-760836228-18751139.jpg&fm=jpg",
    "desc": "عسل مرکبات نیکا از شهد گل‌های پرتقال و نارنج به‌دست می‌آید و طعمی ملایم با رایحه‌ای دل‌نشین دارد. رنگی روشن و بافتی نرم دارد و انتخابی عالی برای صبحانه، چای و نوشیدنی‌های گرم است.",
    "benefits": [
      { "icon": "i-leaf", "label": "سرشار از ویتامین C" },
      { "icon": "i-shield", "label": "تقویت سیستم ایمنی" },
      { "icon": "i-drop", "label": "کمک به هضم آسان‌تر" },
      { "icon": "i-moon", "label": "رایحه‌ای آرامش‌بخش" }
    ]
  },
  "dark": {
    "category": "عسل‌ها",
    "title": "عسل سیاه تلو",
    "tagline": "غلیظ، قوی و بسیار مقوی",
    "emoji": "🍯",
    "price": "۳۱۰,۰۰۰",
    "weight": "۴۵۰ گرم",
    "oldPrice": "۳۴۵,۰۰۰",
    "badge": "پیشنهاد ویژه",
    "origin": "کوهستان‌های شمال ایران",
    "harvest": "پاییز",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/11771949/pexels-photo-11771949.jpeg?cs=srgb&dl=pexels-annmteu-11771949.jpg&fm=jpg",
    "desc": "عسل سیاه تلو با رنگی تیره و طعمی غلیظ، از قوی‌ترین و مقوی‌ترین عسل‌های موجود است. سرشار از املاح معدنی و آنتی‌اکسیدان، انتخابی مناسب برای فصل‌های سرد سال و افرادی است که به دنبال انرژی مضاعف هستند.",
    "benefits": [
      { "icon": "i-shield", "label": "غنی از آنتی‌اکسیدان" },
      { "icon": "i-drop", "label": "منبع خوب آهن" },
      { "icon": "i-zap", "label": "انرژی‌زا و مقوی" },
      { "icon": "i-medal", "label": "خواص ضدالتهابی" }
    ]
  },
  "forest": {
    "category": "عسل‌ها",
    "title": "عسل نمدار",
    "tagline": "خوش‌عطر و آرامش‌بخش",
    "emoji": "🌳",
    "price": "۲۹۰,۰۰۰",
    "weight": "۴۵۰ گرم",
    "origin": "جنگل‌های هیرکانی",
    "harvest": "تابستان",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/11284797/pexels-photo-11284797.jpeg?cs=srgb&dl=pexels-micheile-11284797.jpg&fm=jpg",
    "desc": "عسل نمدار از شهد گل‌های درخت نمدار گردآوری می‌شود و رایحه‌ای خوش و طعمی ملایم با رنگی تیره دارد. این عسل به‌طور سنتی برای آرامش و آسودگی در فصل‌های سرد سال استفاده می‌شود.",
    "benefits": [
      { "icon": "i-leaf", "label": "سرشار از املاح معدنی" },
      { "icon": "i-moon", "label": "کمک به آرامش و خواب راحت" },
      { "icon": "i-drop", "label": "تقویت دستگاه تنفسی" },
      { "icon": "i-medal", "label": "طعم و عطر خوش‌آیند" }
    ]
  },
  "sunflower": {
    "category": "عسل‌ها",
    "title": "عسل کلزا",
    "tagline": "روشن، شیرین و پرانرژی",
    "emoji": "🌾",
    "price": "۲۲۰,۰۰۰",
    "weight": "۴۵۰ گرم",
    "origin": "مزارع کلزای البرز",
    "harvest": "بهار",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/8500508/pexels-photo-8500508.jpeg?cs=srgb&dl=pexels-alexfalconer-8500508.jpg&fm=jpg",
    "desc": "عسل کلزا با رنگی طلایی روشن و طعمی شیرین و ملایم، از مزارع کلزا گردآوری می‌شود. این عسل به دلیل بلوره شدن سریع، بافتی کرمی پیدا می‌کند و منبع خوبی از ویتامین E است.",
    "benefits": [
      { "icon": "i-leaf", "label": "سرشار از ویتامین E" },
      { "icon": "i-shield", "label": "آنتی‌اکسیدان طبیعی" },
      { "icon": "i-heart", "label": "بهبود سلامت پوست" },
      { "icon": "i-zap", "label": "انرژی‌بخش و شیرین" }
    ]
  },
  "blossom": {
    "category": "عسل‌ها",
    "title": "عسل ترنجبین",
    "tagline": "ملایم، خنک و آرامش‌بخش",
    "emoji": "🌼",
    "price": "۲۶۰,۰۰۰",
    "weight": "۴۵۰ گرم",
    "badge": "جدید",
    "origin": "دشت‌های بهاری گیلان",
    "harvest": "بهار",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/17680083/pexels-photo-17680083.jpeg?cs=srgb&dl=pexels-kamrujjamanjewel-17680083.jpg&fm=jpg",
    "desc": "عسل ترنجبین از شهد گل‌های سفید بهاری تهیه می‌شود و طعمی ملایم و خنک با رایحه‌ای دل‌پذیر دارد. به‌طور سنتی برای آرامش دستگاه گوارش و تسکین گلودرد مورد استفاده قرار می‌گیرد.",
    "benefits": [
      { "icon": "i-moon", "label": "آرامش‌بخش دستگاه گوارش" },
      { "icon": "i-drop", "label": "ملین طبیعی و ملایم" },
      { "icon": "i-shield", "label": "کاهش سرفه و گلودرد" },
      { "icon": "i-heart", "label": "طعم و عطر دل‌نشین" }
    ]
  },
  "khareshtor": {
    "category": "عسل‌ها",
    "title": "عسل خارشتر",
    "tagline": "گرم، تسکین‌دهنده و سنتی",
    "emoji": "🌵",
    "price": "۲۷۵,۰۰۰",
    "weight": "۴۵۰ گرم",
    "origin": "دشت‌های کویری ایران",
    "harvest": "تابستان",
    "purity": "۱۰۰٪ خالص و تصفیه‌نشده",
    "image": "https://images.pexels.com/photos/5634207/pexels-photo-5634207.jpeg?cs=srgb&dl=pexels-adonyi-foto-5634207.jpg&fm=jpg",
    "desc": "عسل خارشتر از شهد گیاه خارشتر در مناطق کویری ایران گردآوری می‌شود و طعمی متفاوت و اثری گرم دارد. به‌طور سنتی برای آرامش دستگاه گوارش و تسکین سرماخوردگی مورد استفاده قرار می‌گیرد.",
    "benefits": [
      { "icon": "i-moon", "label": "آرامش‌بخش دستگاه گوارش" },
      { "icon": "i-shield", "label": "تقویت سیستم ایمنی" },
      { "icon": "i-drop", "label": "ملین طبیعی و ملایم" },
      { "icon": "i-leaf", "label": "سرشار از املاح معدنی" }
    ]
  },
  "mix": {
    "category": "ژل رویال و ترکیبات ویژه",
    "title": "عسل + ژل رویال",
    "tagline": "کامل‌ترین ترکیب برای بدنی قوی",
    "emoji": "✨",
    "price": "۳۹۵,۰۰۰",
    "weight": "۳۰۰ گرم",
    "oldPrice": "۴۵۰,۰۰۰",
    "badge": "پرفروش",
    "origin": "تولید داخلی زنبورستان نیکا",
    "harvest": "تمام فصول",
    "purity": "ترکیب طبیعی بدون افزودنی",
    "image": "https://images.pexels.com/photos/4921856/pexels-photo-4921856.jpeg?cs=srgb&dl=pexels-ekaterinabelinskaya-4921856.jpg&fm=jpg",
    "desc": "ترکیبی ویژه از عسل طبیعی و ژل رویال که بمب انرژی و ایمنی بدن است. این مخلوط با تمرکز بر تقویت سیستم ایمنی و بازیابی سریع، مناسب دوران نقاهت، فصول پرمشغله و ورزشکاران است.",
    "benefits": [
      { "icon": "i-shield", "label": "تقویت قدرتمند ایمنی" },
      { "icon": "i-leaf", "label": "غنی از پروتئین و ویتامین B" },
      { "icon": "i-zap", "label": "افزایش انرژی و نشاط" },
      { "icon": "i-heart", "label": "مناسب دوران نقاهت" }
    ]
  }
};

