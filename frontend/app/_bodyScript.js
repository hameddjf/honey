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
    { text: 'عسل نمدار نیکا واقعاً عالیه، عطر و طعم بی‌نظیری داره و کاملاً طبیعی و خالص هست.', name: 'مریم احمدی', city: 'اصفهان', initial: 'م' },
    { text: 'چندین بار از نیکا خریدم، کیفیت بسته‌بندی و طعم عسل‌ها همیشه عالی بوده. ممنون از شما.', name: 'علی رضایی', city: 'تهران', initial: 'ع' },
    { text: 'عسل سیاه تلو نیکا بهترین عسلی هست که تا الان چشیدم، غلیظ و خوشمزه‌ست.', name: 'سارا محمدی', city: 'شیراز', initial: 'س' },
    { text: 'ارسال سریع بود و عسل کلزا طعم فوق‌العاده‌ای داشت، حتماً باز هم سفارش می‌دم.', name: 'رضا کریمی', city: 'مشهد', initial: 'ر' },
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
  document.querySelector('.play-btn')?.addEventListener('click', (event) => {
    const url = event.currentTarget?.dataset?.videoUrl;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  /* ---------- Product detail modal ---------- */
  const PRODUCTS = (typeof window !== 'undefined' && window.__NIKA_PRODUCTS__) || {};

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
  document.querySelectorAll('.cat-dot, .cat-media-link').forEach(btn => {
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
