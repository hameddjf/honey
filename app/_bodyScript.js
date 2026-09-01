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
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  });

  /* ---------- Testimonials carousel ---------- */
  const testimonials = [
    { text: 'عسل جنگل نیکا واقعاً عالیه، عطر و طعم بی‌نظیری داره و کاملاً طبیعی و خالص هست.', name: 'مریم احمدی', city: 'اصفهان', initial: 'م' },
    { text: 'چندین بار از نیکا خریدم، کیفیت بسته‌بندی و طعم عسل‌ها همیشه عالی بوده. ممنون از شما.', name: 'علی رضایی', city: 'تهران', initial: 'ع' },
    { text: 'عسل سیاه تئو نیکا بهترین عسلی هست که تا الان چشیدم، غلیظ و خوشمزه‌ست.', name: 'سارا محمدی', city: 'شیراز', initial: 'س' },
    { text: 'ارسال سریع بود و عسل آفتابگردان طعم فوق‌العاده‌ای داشت، حتماً باز هم سفارش می‌دم.', name: 'رضا کریمی', city: 'مشهد', initial: 'ر' },
    { text: 'بسته‌بندی شیک و بهداشتی، مناسب هدیه دادن هم هست. کیفیت عسل هم عالی بود.', name: 'نگار توکلی', city: 'ساری', initial: 'ن' },
  ];
  const wrap = document.querySelector('.testimonial-cards');
  let start = 0;

  const renderTestimonials = () => {
    if (!wrap) return;
    wrap.style.opacity = '0';
    setTimeout(() => {
      wrap.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const t = testimonials[(start + i) % testimonials.length];
        const card = document.createElement('article');
        card.className = 'testi-card';
        card.innerHTML = \`
          <div class="testi-top">
            <div class="stars">
              \${'<svg class="icon icon-sm"><use href="#i-star"/></svg>'.repeat(5)}
            </div>
            <svg class="icon quote-icon"><use href="#i-quote"/></svg>
          </div>
          <p>\${t.text}</p>
          <div class="testi-user">
            <span class="avatar">\${t.initial}</span>
            <span class="testi-user-info"><strong>\${t.name}</strong><small>\${t.city}</small></span>
          </div>\`;
        wrap.appendChild(card);
      }
      wrap.style.opacity = '1';
    }, 180);
  };

  document.getElementById('testNext')?.addEventListener('click', () => {
    start = (start + 1) % testimonials.length;
    renderTestimonials();
  });
  document.getElementById('testPrev')?.addEventListener('click', () => {
    start = (start - 1 + testimonials.length) % testimonials.length;
    renderTestimonials();
  });
  if (wrap) wrap.style.transition = 'opacity .18s ease';

  /* ---------- About video play button ---------- */
  document.querySelector('.play-btn')?.addEventListener('click', () => {
    toast.textContent = '🎬 نمایش ویدئو در نسخه دمو فعال نیست';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  });

  /* ---------- Product detail modal ---------- */
  const PRODUCTS = {"citrus": {"title": "عسل مرکبات", "tagline": "ملایم، معطر و سرشار از انرژی", "emoji": "🍊", "price": "۲۴۰,۰۰۰", "weight": "۴۵۰ گرم", "badge": "پرفروش", "origin": "باغات مرکبات مازندران", "harvest": "بهار", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/citrus.jpg", "desc": "عسل مرکبات نیکا از شهد گل‌های پرتقال و نارنج به‌دست می‌آید و طعمی ملایم با رایحه‌ای دل‌نشین دارد. رنگی روشن و بافتی نرم دارد و انتخابی عالی برای صبحانه، چای و نوشیدنی‌های گرم است.", "benefits": [{"icon": "i-leaf", "label": "سرشار از ویتامین C"}, {"icon": "i-shield", "label": "تقویت سیستم ایمنی"}, {"icon": "i-drop", "label": "کمک به هضم آسان‌تر"}, {"icon": "i-moon", "label": "رایحه‌ای آرامش‌بخش"}]}, "dark": {"title": "عسل سیاه تئو", "tagline": "غلیظ، قوی و بسیار مقوی", "emoji": "🍯", "price": "۳۱۰,۰۰۰", "weight": "۴۵۰ گرم", "oldPrice": "۳۴۵,۰۰۰", "badge": "پیشنهاد ویژه", "origin": "کوهستان‌های شمال ایران", "harvest": "پاییز", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/dark.jpg", "desc": "عسل سیاه تئو با رنگی تیره و طعمی غلیظ، از قوی‌ترین و مقوی‌ترین عسل‌های موجود است. سرشار از املاح معدنی و آنتی‌اکسیدان، انتخابی مناسب برای فصل‌های سرد سال و افرادی است که به دنبال انرژی مضاعف هستند.", "benefits": [{"icon": "i-shield", "label": "غنی از آنتی‌اکسیدان"}, {"icon": "i-drop", "label": "منبع خوب آهن"}, {"icon": "i-zap", "label": "انرژی‌زا و مقوی"}, {"icon": "i-medal", "label": "خواص ضدالتهابی"}]}, "forest": {"title": "عسل جنگل", "tagline": "طعمی قوی از دل طبیعت بکر", "emoji": "🌲", "price": "۲۹۰,۰۰۰", "weight": "۴۵۰ گرم", "origin": "جنگل‌های هیرکانی", "harvest": "تابستان", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/forest.jpg", "desc": "عسل جنگل از شهد گیاهان جنگلی و شبنم برگ درختان گردآوری می‌شود و طعمی قوی و ماندگار با رنگی تیره دارد. این عسل به‌دلیل غلظت بالای املاح معدنی، برای تقویت بدن در فصول سرد بسیار توصیه می‌شود.", "benefits": [{"icon": "i-leaf", "label": "سرشار از املاح معدنی"}, {"icon": "i-shield", "label": "خاصیت ضدباکتریایی"}, {"icon": "i-drop", "label": "تقویت دستگاه تنفسی"}, {"icon": "i-medal", "label": "طعم قوی و ماندگار"}]}, "sunflower": {"title": "عسل آفتابگردان", "tagline": "روشن، شیرین و پرانرژی", "emoji": "🌻", "price": "۲۲۰,۰۰۰", "weight": "۴۵۰ گرم", "origin": "مزارع آفتابگردان البرز", "harvest": "تابستان", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/sunflower.jpg", "desc": "عسل آفتابگردان با رنگی طلایی روشن و طعمی شیرین و ملایم، از مزارع آفتابگردان گردآوری می‌شود. این عسل به دلیل بلوره شدن سریع، بافتی کرمی پیدا می‌کند و منبع خوبی از ویتامین E است.", "benefits": [{"icon": "i-leaf", "label": "سرشار از ویتامین E"}, {"icon": "i-shield", "label": "آنتی‌اکسیدان طبیعی"}, {"icon": "i-heart", "label": "بهبود سلامت پوست"}, {"icon": "i-zap", "label": "انرژی‌بخش و شیرین"}]}, "blossom": {"title": "عسل ترنجبین", "tagline": "ملایم، خنک و آرامش‌بخش", "emoji": "🌼", "price": "۲۶۰,۰۰۰", "weight": "۴۵۰ گرم", "badge": "جدید", "origin": "دشت‌های بهاری گیلان", "harvest": "بهار", "purity": "۱۰۰٪ خالص و تصفیه‌نشده", "image": "/images/products/blossom.jpg", "desc": "عسل ترنجبین از شهد گل‌های سفید بهاری تهیه می‌شود و طعمی ملایم و خنک با رایحه‌ای دل‌پذیر دارد. به‌طور سنتی برای آرامش دستگاه گوارش و تسکین گلودرد مورد استفاده قرار می‌گیرد.", "benefits": [{"icon": "i-moon", "label": "آرامش‌بخش دستگاه گوارش"}, {"icon": "i-drop", "label": "ملین طبیعی و ملایم"}, {"icon": "i-shield", "label": "کاهش سرفه و گلودرد"}, {"icon": "i-heart", "label": "طعم و عطر دل‌نشین"}]}, "mix": {"title": "میکس عسل، ژل رویال و گرده گل", "tagline": "کامل‌ترین ترکیب برای بدنی قوی", "emoji": "✨", "price": "۳۹۵,۰۰۰", "weight": "۳۰۰ گرم", "oldPrice": "۴۵۰,۰۰۰", "badge": "پرفروش", "origin": "تولید داخلی زنبورستان نیکا", "harvest": "تمام فصول", "purity": "ترکیب طبیعی بدون افزودنی", "image": "/images/products/mix.jpg", "desc": "ترکیبی ویژه از عسل طبیعی، ژل رویال و گرده گل که بمب انرژی و ایمنی بدن است. این مخلوط با تمرکز بر تقویت سیستم ایمنی و بازیابی سریع، مناسب دوران نقاهت، فصول پرمشغله و ورزشکاران است.", "benefits": [{"icon": "i-shield", "label": "تقویت قدرتمند ایمنی"}, {"icon": "i-leaf", "label": "غنی از پروتئین و ویتامین B"}, {"icon": "i-zap", "label": "افزایش انرژی و نشاط"}, {"icon": "i-heart", "label": "مناسب دوران نقاهت"}]}};

  const modal = document.getElementById('productModal');
  const modalImg = document.getElementById('modalImg');
  const modalEmoji = document.getElementById('modalEmoji');
  const modalTagline = document.getElementById('modalTagline');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalBenefits = document.getElementById('modalBenefits');
  const modalPrice = document.getElementById('modalPrice');
  const modalFullLink = document.getElementById('modalFullLink');
  let lastFocused = null;

  const openModal = (key) => {
    const p = PRODUCTS[key];
    if (!p || !modal) return;
    modalImg.src = p.image;
    modalImg.alt = p.title;
    modalEmoji.textContent = p.emoji;
    modalTagline.textContent = p.tagline;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.desc;
    modalPrice.textContent = p.price;
    if (modalFullLink) modalFullLink.href = \`/product/\${key}\`;
    modalBenefits.innerHTML = p.benefits.map(b => \`
      <div class="modal-benefit">
        <span class="modal-benefit-icon"><svg class="icon"><use href="#\${b.icon}"/></svg></span>
        <span>\${b.label}</span>
      </div>\`).join('');
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose')?.focus();
  };

  const closeModal = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.product));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.dataset.product);
      }
    });
  });
  document.querySelectorAll('.cat-dot').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  /* ---------- Cart counter ---------- */
  let cartCount = 0;
  const cartBadges = document.querySelectorAll('.cart-badge, .mbn-badge');
  const addToCart = () => {
    cartCount++;
    cartBadges.forEach(cartBadge => {
      cartBadge.textContent = cartCount;
      cartBadge.classList.remove('bump');
      void cartBadge.offsetWidth; // restart animation
      cartBadge.classList.add('bump');
    });
  };

  document.getElementById('modalAddBtn')?.addEventListener('click', () => {
    addToCart();
    closeModal();
    toast.textContent = '🛒 محصول به سبد خرید اضافه شد';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });
});

`;

export default bodyScript;
