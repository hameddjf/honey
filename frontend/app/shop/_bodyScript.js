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
  const PRODUCTS = (typeof window !== 'undefined' && window.__NIKA_PRODUCTS__) || {};
  /* ---------- Render shop grid from PRODUCTS ---------- */
  const shopGrid = document.getElementById('shopGrid');
  const toFa = (n) => n.toString().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const priceNum = (p) => parseInt(p.replace(/[^۰-۹0-9]/g, '').replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]));

  const cardHTML = (key, p) => \`
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
          <div class="product-card-price">
            <span>\${p.price}</span><small>تومان</small>
          </div>
          <button class="product-card-add" data-key="\${key}" aria-label="افزودن به سبد"><svg class="icon"><use href="#i-cart"/></svg></button>
        </div>
      </div>
    </article>\`;

  const renderShop = (sort = 'default', category = 'all') => {
    let entries = Object.entries(PRODUCTS);
    if (category !== 'all') entries = entries.filter(([, p]) => p.category === category);
    if (sort === 'price-asc') entries.sort((a, b) => priceNum(a[1].price) - priceNum(b[1].price));
    if (sort === 'price-desc') entries.sort((a, b) => priceNum(b[1].price) - priceNum(a[1].price));
    shopGrid.innerHTML = entries.map(([key, p]) => cardHTML(key, p)).join('');
    document.getElementById('shopCount').textContent = toFa(entries.length);
    shopGrid.querySelectorAll('.product-card-add').forEach(btn => {
      btn.addEventListener('click', () => {
        bumpCartBadge();
        showToast('🛒 ' + PRODUCTS[btn.dataset.key].title + ' به سبد خرید اضافه شد');
      });
    });
  };

  /* ---------- Category tabs ---------- */
  const categoryHint = document.getElementById('shopCategoryHint');
  const categoryHints = {
    'ژل رویال و ترکیبات ویژه': 'این دسته شامل ژل رویال و ترکیبات ویژه است؛ محصولاتی متفاوت از عسل معمولی که برای تقویت بیشتر بدن تهیه شده‌اند.',
    'عسل‌ها': 'انواع عسل خالص و طبیعی نیکا، هرکدام با طعم و منشأ متفاوت.',
  };
  const updateCategoryHint = (category) => {
    if (!categoryHint) return;
    categoryHint.textContent = categoryHints[category] || '';
  };

  let currentSort = 'default';
  let currentCategory = 'all';
  const initialCategory = new URLSearchParams(window.location.search).get('category');
  if (initialCategory) currentCategory = initialCategory;

  const tabButtons = document.querySelectorAll('.shop-category-tab');
  tabButtons.forEach((btn) => {
    if (btn.dataset.category === currentCategory) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      tabButtons.forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      updateCategoryHint(currentCategory);
      renderShop(currentSort, currentCategory);
    });
  });

  updateCategoryHint(currentCategory);
  renderShop(currentSort, currentCategory);
  document.getElementById('shopSort')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderShop(currentSort, currentCategory);
  });

});
`;

export default bodyScript;
