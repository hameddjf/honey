// Auto-extracted verbatim markup/script from the original demo HTML (with routing fixes)
const bodyScript = `
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mainNav.classList.toggle('open');
  });
  mainNav?.querySelectorAll('.has-dropdown > a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });
  mainNav?.querySelectorAll('ul > li:not(.has-dropdown) > a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      mainNav.classList.remove('open');
    });
  });

  /* ---------- Mobile search toggle ---------- */
  const mSearchToggle = document.getElementById('mobileSearchToggle');
  const mSearchBar = document.getElementById('mobileSearchBar');
  mSearchToggle?.addEventListener('click', () => {
    mSearchBar.classList.toggle('open');
    if (mSearchBar.classList.contains('open')) mSearchBar.querySelector('input')?.focus();
  });
  document.getElementById('mbnSearch')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mSearchBar?.classList.add('open');
    setTimeout(() => mSearchBar?.querySelector('input')?.focus(), 350);
  });

  /* ---------- Header shadow on scroll + back-to-top ---------- */
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 6);
    backToTop?.classList.toggle('show', window.scrollY > 600);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Newsletter form ---------- */
  const form = document.getElementById('newsletterForm');

  /* ---------- Footer accordion (mobile) ---------- */
  document.querySelectorAll('.footer-accordion > h4').forEach(h4 => {
    h4.addEventListener('click', () => {
      h4.parentElement.classList.toggle('open');
    });
  });
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    showToast('با تشکر! عضویت شما ثبت شد 🐝');
  });

  /* ---------- Cart badge (demo, resets per page) ---------- */
  let cartCount = 0;
  const cartBadges = document.querySelectorAll('.cart-badge, .mbn-badge');
  const bumpCartBadge = () => {
    cartCount++;
    cartBadges.forEach(b => {
      b.textContent = cartCount;
      b.classList.remove('bump');
      void b.offsetWidth;
      b.classList.add('bump');
    });
  };

  const PRODUCTS = {"citrus": {"title": "عسل مرکبات", "tagline": "ملایم، معطر و سرشار از انرژی", "emoji": "🍊", "price": "۲۴۰,۰۰۰", "weight": "۴۵۰ گرم", "badge": "پرفروش", "origin": "باغات مرکبات مازندران", "harvest": "بهار", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/citrus.jpg", "desc": "عسل مرکبات نیکا از شهد گل‌های پرتقال و نارنج به‌دست می‌آید و طعمی ملایم با رایحه‌ای دل‌نشین دارد. رنگی روشن و بافتی نرم دارد و انتخابی عالی برای صبحانه، چای و نوشیدنی‌های گرم است.", "benefits": [{"icon": "i-leaf", "label": "سرشار از ویتامین C"}, {"icon": "i-shield", "label": "تقویت سیستم ایمنی"}, {"icon": "i-drop", "label": "کمک به هضم آسان‌تر"}, {"icon": "i-moon", "label": "رایحه‌ای آرامش‌بخش"}]}, "dark": {"title": "عسل سیاه تئو", "tagline": "غلیظ، قوی و بسیار مقوی", "emoji": "🍯", "price": "۳۱۰,۰۰۰", "weight": "۴۵۰ گرم", "oldPrice": "۳۴۵,۰۰۰", "badge": "پیشنهاد ویژه", "origin": "کوهستان‌های شمال ایران", "harvest": "پاییز", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/dark.jpg", "desc": "عسل سیاه تئو با رنگی تیره و طعمی غلیظ، از قوی‌ترین و مقوی‌ترین عسل‌های موجود است. سرشار از املاح معدنی و آنتی‌اکسیدان، انتخابی مناسب برای فصل‌های سرد سال و افرادی است که به دنبال انرژی مضاعف هستند.", "benefits": [{"icon": "i-shield", "label": "غنی از آنتی‌اکسیدان"}, {"icon": "i-drop", "label": "منبع خوب آهن"}, {"icon": "i-zap", "label": "انرژی‌زا و مقوی"}, {"icon": "i-medal", "label": "خواص ضدالتهابی"}]}, "forest": {"title": "عسل جنگل", "tagline": "طعمی قوی از دل طبیعت بکر", "emoji": "🌲", "price": "۲۹۰,۰۰۰", "weight": "۴۵۰ گرم", "origin": "جنگل‌های هیرکانی", "harvest": "تابستان", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/forest.jpg", "desc": "عسل جنگل از شهد گیاهان جنگلی و شبنم برگ درختان گردآوری می‌شود و طعمی قوی و ماندگار با رنگی تیره دارد. این عسل به‌دلیل غلظت بالای املاح معدنی، برای تقویت بدن در فصول سرد بسیار توصیه می‌شود.", "benefits": [{"icon": "i-leaf", "label": "سرشار از املاح معدنی"}, {"icon": "i-shield", "label": "خاصیت ضدباکتریایی"}, {"icon": "i-drop", "label": "تقویت دستگاه تنفسی"}, {"icon": "i-medal", "label": "طعم قوی و ماندگار"}]}, "sunflower": {"title": "عسل آفتابگردان", "tagline": "روشن، شیرین و پرانرژی", "emoji": "🌻", "price": "۲۲۰,۰۰۰", "weight": "۴۵۰ گرم", "origin": "مزارع آفتابگردان البرز", "harvest": "تابستان", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/sunflower.jpg", "desc": "عسل آفتابگردان با رنگی طلایی روشن و طعمی شیرین و ملایم، از مزارع آفتابگردان گردآوری می‌شود. این عسل به دلیل بلوره شدن سریع، بافتی کرمی پیدا می‌کند و منبع خوبی از ویتامین E است.", "benefits": [{"icon": "i-leaf", "label": "سرشار از ویتامین E"}, {"icon": "i-shield", "label": "آنتی‌اکسیدان طبیعی"}, {"icon": "i-heart", "label": "بهبود سلامت پوست"}, {"icon": "i-zap", "label": "انرژی‌بخش و شیرین"}]}, "blossom": {"title": "عسل ترنجبین", "tagline": "ملایم، خنک و آرامش‌بخش", "emoji": "🌼", "price": "۲۶۰,۰۰۰", "weight": "۴۵۰ گرم", "badge": "جدید", "origin": "دشت‌های بهاری گیلان", "harvest": "بهار", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/blossom.jpg", "desc": "عسل ترنجبین از شهد گل‌های سفید بهاری تهیه می‌شود و طعمی ملایم و خنک با رایحه‌ای دل‌پذیر دارد. به‌طور سنتی برای آرامش دستگاه گوارش و تسکین گلودرد مورد استفاده قرار می‌گیرد.", "benefits": [{"icon": "i-moon", "label": "آرامش‌بخش دستگاه گوارش"}, {"icon": "i-drop", "label": "ملین طبیعی و ملایم"}, {"icon": "i-shield", "label": "کاهش سرفه و گلودرد"}, {"icon": "i-heart", "label": "طعم و عطر دل‌نشین"}]}, "mix": {"title": "میکس عسل، ژل رویال و گرده گل", "tagline": "کامل‌ترین ترکیب برای بدنی قوی", "emoji": "✨", "price": "۳۹۵,۰۰۰", "weight": "۳۰۰ گرم", "oldPrice": "۴۵۰,۰۰۰", "badge": "پرفروش", "origin": "تولید داخلی زنبورستان نیکا", "harvest": "تمام فصول", "purity": "ترکیب طبیعی بدون افزودنی", "image": "/images/products/mix.jpg", "desc": "ترکیبی ویژه از عسل طبیعی، ژل رویال و گرده گل که بمب انرژی و ایمنی بدن است. این مخلوط با تمرکز بر تقویت سیستم ایمنی و بازیابی سریع، مناسب دوران نقاهت، فصول پرمشغله و ورزشکاران است.", "benefits": [{"icon": "i-shield", "label": "تقویت قدرتمند ایمنی"}, {"icon": "i-leaf", "label": "غنی از پروتئین و ویتامین B"}, {"icon": "i-zap", "label": "افزایش انرژی و نشاط"}, {"icon": "i-heart", "label": "مناسب دوران نقاهت"}]}};

  /* ---------- Product detail page ---------- */
  const toFa = (n) => n.toString().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const requestedKey = typeof window !== 'undefined' ? window.__PRODUCT_SLUG__ : null;
  const productKey = PRODUCTS[requestedKey] ? requestedKey : 'citrus';
  const product = PRODUCTS[productKey];

  document.title = product.title + ' | عسل طبیعی نیکا';
  document.getElementById('crumbTitle').textContent = product.title;
  document.getElementById('pdTagline').textContent = product.tagline;
  document.getElementById('pdTitle').textContent = product.title;
  document.getElementById('pdEmoji').textContent = product.emoji;
  document.getElementById('pdPrice').textContent = product.price;
  document.getElementById('pdMobilePrice').textContent = product.price;
  document.getElementById('pdDesc').textContent = product.desc;
  document.getElementById('pdFullDesc').textContent = product.desc + ' این محصول با استانداردهای بالای بهداشتی بسته‌بندی شده و برای حفظ کیفیت، دور از نور مستقیم آفتاب نگهداری شود. مصرف روزانه ۱ تا ۲ قاشق غذاخوری برای بهره‌مندی از خواص این عسل توصیه می‌شود.';
  if (product.oldPrice) {
    document.getElementById('pdOldPrice').textContent = product.oldPrice + ' تومان';
  }

  const galleryImgs = [product.image, '/images/products/jar-closeup.jpg', '/images/products/mix.jpg'];
  const mainImg = document.getElementById('pdMainImg');
  mainImg.src = galleryImgs[0];
  mainImg.alt = product.title;
  document.getElementById('pdThumbs').innerHTML = galleryImgs.map((src, i) => \`
    <button class="\${i === 0 ? 'active' : ''}" data-src="\${src}"><img src="\${src}" alt="\${product.title} - نمای \${toFa(i+1)}"></button>\`).join('');
  document.querySelectorAll('.pd-gallery-thumbs button').forEach(btn => {
    btn.addEventListener('click', () => {
      mainImg.src = btn.dataset.src;
      document.querySelectorAll('.pd-gallery-thumbs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('pdBenefits').innerHTML = product.benefits.map(b => \`
    <div class="pd-benefit">
      <span class="pd-benefit-icon"><svg class="icon"><use href="#\${b.icon}"/></svg></span>
      <span>\${b.label}</span>
    </div>\`).join('');

  document.getElementById('specTable').innerHTML = \`
    <tr><td>وزن خالص</td><td>\${product.weight || '—'}</td></tr>
    <tr><td>مبدأ</td><td>\${product.origin || '—'}</td></tr>
    <tr><td>فصل برداشت</td><td>\${product.harvest || '—'}</td></tr>
    <tr><td>درجه خلوص</td><td>\${product.purity || '—'}</td></tr>
    <tr><td>شرایط نگهداری</td><td>دور از نور مستقیم آفتاب، دمای محیط</td></tr>\`;

  /* Tabs */
  document.querySelectorAll('.pd-tab-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pd-tab-buttons button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pd-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  /* Quantity stepper */
  let qty = 1;
  const qtyLabel = document.getElementById('pdQty');
  document.querySelector('.pd-actions .qty-plus').addEventListener('click', () => { qty++; qtyLabel.textContent = toFa(qty); });
  document.querySelector('.pd-actions .qty-minus').addEventListener('click', () => { if (qty > 1) qty--; qtyLabel.textContent = toFa(qty); });

  const addProductToCart = () => {
    for (let i = 0; i < qty; i++) bumpCartBadge();
    showToast('🛒 ' + toFa(qty) + ' عدد ' + product.title + ' به سبد خرید اضافه شد');
  };
  document.getElementById('pdAddBtn')?.addEventListener('click', addProductToCart);
  document.getElementById('pdMobileAddBtn')?.addEventListener('click', addProductToCart);

  document.getElementById('pdWishBtn')?.addEventListener('click', function () {
    this.classList.toggle('active');
    showToast(this.classList.contains('active') ? '💛 به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
  });

  /* Related products */
  const relatedGrid = document.getElementById('relatedGrid');
  const relatedKeys = Object.keys(PRODUCTS).filter(k => k !== productKey).slice(0, 4);
  relatedGrid.innerHTML = relatedKeys.map(key => {
    const p = PRODUCTS[key];
    return \`
    <article class="product-card">
      <div class="product-card-media">
        <a href="/product/\${key}"><img src="\${p.image}" alt="\${p.title}" loading="lazy"></a>
        \${p.badge ? \`<span class="product-card-badge">\${p.badge}</span>\` : ''}
        <span class="product-card-emoji">\${p.emoji}</span>
      </div>
      <div class="product-card-body">
        <span class="product-card-tagline">\${p.tagline}</span>
        <h3><a href="/product/\${key}">\${p.title}</a></h3>
        <div class="product-card-footer">
          <div class="product-card-price"><span>\${p.price}</span><small>تومان</small></div>
          <button class="product-card-add" data-key="\${key}" aria-label="افزودن به سبد"><svg class="icon"><use href="#i-cart"/></svg></button>
        </div>
      </div>
    </article>\`;
  }).join('');
  relatedGrid.querySelectorAll('.product-card-add').forEach(btn => {
    btn.addEventListener('click', () => {
      bumpCartBadge();
      showToast('🛒 ' + PRODUCTS[btn.dataset.key].title + ' به سبد خرید اضافه شد');
    });
  });

});
`;

export default bodyScript;
