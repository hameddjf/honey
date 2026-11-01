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

  /* ---------- Cart page (demo state, persisted in localStorage) ---------- */
  const CART_KEY = 'nika_cart';
  const DEFAULT_CART = [
    { key: 'citrus', qty: 2 },
    { key: 'dark', qty: 1 },
    { key: 'mix', qty: 1 },
  ];
  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return DEFAULT_CART.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_CART.slice();
    } catch {
      return DEFAULT_CART.slice();
    }
  };
  const saveCart = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  };
  let cart = loadCart();

  const priceNum = (p) => parseInt(p.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[^0-9]/g, ''));
  const toFa = (n) => n.toString().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const formatToman = (n) => toFa(n.toLocaleString('en-US')) + ' تومان';

  const cartItemsEl = document.getElementById('cartItems');
  const cartLayout = document.getElementById('cartLayout');
  const cartEmpty = document.getElementById('cartEmpty');
  const FREE_SHIP_THRESHOLD = 1000000;
  const SHIP_COST = 45000;

  const renderCart = () => {
    saveCart();
    if (cart.length === 0) {
      cartLayout.style.display = 'none';
      cartEmpty.style.display = 'block';
      cartBadges.forEach(b => b.textContent = '0');
      return;
    }
    cartLayout.style.display = 'grid';
    cartEmpty.style.display = 'none';

    cartItemsEl.innerHTML = cart.map(({ key, qty }) => {
      const p = PRODUCTS[key];
      const lineTotal = priceNum(p.price) * qty;
      return \`
      <div class="cart-item" data-key="\${key}">
        <a href="/product/\${key}"><img src="\${p.image}" alt="\${p.title}"></a>
        <div class="cart-item-info">
          <h4><a href="/product/\${key}">\${p.title}</a></h4>
          <span class="tag">\${p.sizeLabel || ''}</span>
        </div>
        <div class="cart-item-side">
          <button class="cart-item-remove" aria-label="حذف از سبد"><svg class="icon"><use href="#i-trash"/></svg></button>
          <div class="qty-stepper">
            <button class="qty-minus" aria-label="کاهش تعداد"><svg class="icon"><use href="#i-minus"/></svg></button>
            <span>\${toFa(qty)}</span>
            <button class="qty-plus" aria-label="افزایش تعداد"><svg class="icon"><use href="#i-plus"/></svg></button>
          </div>
          <span class="cart-item-price">\${formatToman(lineTotal)}</span>
        </div>
      </div>\`;
    }).join('');

    const subtotal = cart.reduce((sum, { key, qty }) => sum + priceNum(PRODUCTS[key].price) * qty, 0);
    const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_COST;
    document.getElementById('sumSubtotal').textContent = formatToman(subtotal);
    document.getElementById('sumShipping').textContent = shipping === 0 ? 'رایگان' : formatToman(shipping);
    document.getElementById('sumTotal').textContent = formatToman(subtotal + shipping);

    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    cartBadges.forEach(b => b.textContent = toFa(totalQty));

    cartItemsEl.querySelectorAll('.cart-item').forEach(row => {
      const key = row.dataset.key;
      row.querySelector('.qty-plus').addEventListener('click', () => {
        cart.find(i => i.key === key).qty++;
        renderCart();
      });
      row.querySelector('.qty-minus').addEventListener('click', () => {
        const item = cart.find(i => i.key === key);
        if (item.qty > 1) item.qty--; else cart = cart.filter(i => i.key !== key);
        renderCart();
      });
      row.querySelector('.cart-item-remove').addEventListener('click', () => {
        cart = cart.filter(i => i.key !== key);
        renderCart();
        showToast('محصول از سبد خرید حذف شد');
      });
    });
  };

  renderCart();

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    saveCart();
    window.location.href = '/checkout';
  });

});
`;

export default bodyScript;
