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
  /* ---------- Product detail page ---------- */
  const toFa = (n) => n.toString().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const requestedKey = typeof window !== 'undefined' ? window.__PRODUCT_SLUG__ : null;
  const productKey = PRODUCTS[requestedKey] ? requestedKey : 'citrus';
  const product = PRODUCTS[productKey];

  document.title = product.title + ' | عسل طبیعی نیکا';
  document.getElementById('crumbTitle').textContent = product.title;
  const crumbCategoryEl = document.getElementById('crumbCategory');
  if (crumbCategoryEl) {
    crumbCategoryEl.textContent = product.category || '';
    crumbCategoryEl.href = product.category ? '/shop?category=' + encodeURIComponent(product.category) : '/shop';
  }
  const categoryChipEl = document.getElementById('pdCategoryChip');
  if (categoryChipEl) categoryChipEl.textContent = product.category || '';
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

  const galleryImgs = (product.images && product.images.length) ? product.images : [product.image];
  const mainImg = document.getElementById('pdMainImg');
  mainImg.onerror = () => {
    mainImg.onerror = null;
    if (product.fallbackImage) mainImg.src = product.fallbackImage;
  };
  mainImg.src = galleryImgs[0];
  mainImg.alt = product.title;
  document.getElementById('pdThumbs').innerHTML = galleryImgs.map((src, i) => \`
    <button class="\${i === 0 ? 'active' : ''}" data-src="\${src}"><img src="\${src}" data-fallback="\${(product.fallbackImages && product.fallbackImages[i]) || product.fallbackImage || ''}" onerror="this.onerror=null;if(this.dataset.fallback)this.src=this.dataset.fallback;" alt="\${product.title} - نمای \${toFa(i+1)}"></button>\`).join('');
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
    <tr><td>وزن خالص</td><td>\${product.sizeLabel || '—'}</td></tr>
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

  /* Related products — همان دسته‌بندی در اولویت است تا مشتری تفاوت
     «ژل رویال و ترکیبات ویژه» با «عسل‌ها» را گم نکند؛ در صورت کم بودن
     تعداد، از باقی محصولات تکمیل می‌شود. */
  const relatedGrid = document.getElementById('relatedGrid');
  const currentCategory = PRODUCTS[productKey]?.category;
  const otherKeys = Object.keys(PRODUCTS).filter(k => k !== productKey);
  const sameCategoryKeys = otherKeys.filter(k => PRODUCTS[k].category === currentCategory);
  const otherCategoryKeys = otherKeys.filter(k => PRODUCTS[k].category !== currentCategory);
  const relatedKeys = [...sameCategoryKeys, ...otherCategoryKeys].slice(0, 12);
  relatedGrid.innerHTML = relatedKeys.map(key => {
    const p = PRODUCTS[key];
    return \`
    <article class="product-card">
      <div class="product-card-media">
        <a href="/product/\${key}"><img src="\${p.image}" data-fallback="\${p.fallbackImage || ''}" onerror="this.onerror=null;if(this.dataset.fallback)this.src=this.dataset.fallback;" alt="\${p.title}" loading="lazy"></a>
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

  /* ---------- Related products: کشویی (slider) ----------
     دکمه‌ها، نوار پیشرفت (قابل کلیک)، شمارنده، محو شدن لبه‌ها، کشیدن با موس
     و کیبورد — سازگار با RTL (scrollLeft در RTL منفی است). */
  const relPrev = document.getElementById('relPrev');
  const relNext = document.getElementById('relNext');
  const relSlider = document.getElementById('relSlider');
  const relProgress = document.getElementById('relProgress');
  const relThumb = document.getElementById('relThumb');
  const relCounter = document.getElementById('relCounter');
  const isRtl = () => getComputedStyle(relatedGrid).direction === 'rtl';
  const relDir = () => (isRtl() ? -1 : 1);
  const relCards = () => Array.from(relatedGrid.querySelectorAll('.product-card'));
  const relStep = () => {
    const c = relCards()[0];
    const gap = parseFloat(getComputedStyle(relatedGrid).columnGap || getComputedStyle(relatedGrid).gap) || 0;
    const cardW = c ? c.getBoundingClientRect().width + gap : 240;
    const perView = Math.max(1, Math.floor(relatedGrid.clientWidth / cardW));
    return cardW * Math.max(1, perView - (perView > 2 ? 1 : 0));
  };
  const updateRel = () => {
    const max = Math.max(0, relatedGrid.scrollWidth - relatedGrid.clientWidth);
    const pos = Math.min(max, Math.abs(relatedGrid.scrollLeft));
    const atStart = pos < 4;
    const atEnd = pos > max - 4;
    if (relPrev) relPrev.disabled = atStart;
    if (relNext) relNext.disabled = atEnd;
    const hiddenLeft = isRtl() ? max - pos : pos;
    const hiddenRight = isRtl() ? pos : max - pos;
    relSlider.classList.toggle('fade-left', hiddenLeft > 4);
    relSlider.classList.toggle('fade-right', hiddenRight > 4);
    const noScroll = max <= 4;
    if (relProgress) relProgress.hidden = noScroll;
    if (relPrev) relPrev.parentElement.classList.toggle('is-static', noScroll);
    if (relThumb && !noScroll) {
      const ratio = relatedGrid.clientWidth / relatedGrid.scrollWidth;
      const thumbPct = Math.max(14, ratio * 100);
      relThumb.style.width = thumbPct + '%';
      relThumb.style.insetInlineStart = ((pos / max) * (100 - thumbPct)) + '%';
    }
    if (relCounter) {
      const cards = relCards();
      const total = cards.length;
      const first = cards[0];
      const stepW = first ? first.getBoundingClientRect().width + (parseFloat(getComputedStyle(relatedGrid).columnGap) || 0) : 1;
      const idx = Math.min(total, Math.round(pos / stepW) + 1);
      const visible = Math.max(1, Math.round(relatedGrid.clientWidth / stepW));
      const last = Math.min(total, idx + visible - 1);
      relCounter.textContent = noScroll ? '' : (visible > 1 ? toFa(idx) + '–' + toFa(last) : toFa(idx)) + ' از ' + toFa(total);
    }
  };
  relPrev?.addEventListener('click', () => relatedGrid.scrollBy({ left: -relDir() * relStep(), behavior: 'smooth' }));
  relNext?.addEventListener('click', () => relatedGrid.scrollBy({ left: relDir() * relStep(), behavior: 'smooth' }));
  relatedGrid.addEventListener('scroll', () => requestAnimationFrame(updateRel), { passive: true });
  window.addEventListener('resize', updateRel);
  relatedGrid.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); relNext?.click(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); relPrev?.click(); }
  });

  // کلیک روی نوار پیشرفت = پرش به همان نقطه
  relProgress?.addEventListener('click', (e) => {
    const rect = relProgress.getBoundingClientRect();
    let frac = (e.clientX - rect.left) / rect.width;
    if (isRtl()) frac = 1 - frac;
    const max = relatedGrid.scrollWidth - relatedGrid.clientWidth;
    relatedGrid.scrollTo({ left: relDir() * Math.max(0, Math.min(1, frac)) * max, behavior: 'smooth' });
  });

  // کشیدن با موس (روی لمسی‌ها اسکرول بومی کار می‌کند)
  (() => {
    let down = false, startX = 0, startScroll = 0, moved = false;
    relatedGrid.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest('button')) return;
      down = true; moved = false; startX = e.clientX; startScroll = relatedGrid.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; relatedGrid.classList.add('is-dragging'); }
      if (moved) relatedGrid.scrollLeft = startScroll - dx;
    });
    const end = () => {
      if (!down) return;
      down = false;
      if (moved) {
        relatedGrid.classList.remove('is-dragging');
        const suppress = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
        relatedGrid.addEventListener('click', suppress, { capture: true, once: true });
        setTimeout(() => relatedGrid.removeEventListener('click', suppress, true), 0);
      }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    relatedGrid.addEventListener('dragstart', (e) => e.preventDefault());
  })();

  updateRel();
  setTimeout(updateRel, 400);
  setTimeout(updateRel, 1200);

  /* ---------- Reviews: دو بخش (نظرات دریافتی / ثبت نظر) — پیش‌فرض: نظرات دریافتی ---------- */
  const REVIEW_POOL = [
    { name: 'مریم احمدی', city: 'اصفهان', rating: 5, text: 'عسلش خیلی خوش‌طعم و خالصه، بسته‌بندیش هم شیک بود. حتماً باز سفارش می‌دم.' },
    { name: 'رضا کریمی', city: 'مشهد', rating: 5, text: 'ارسال سریع بود و کیفیت عسل با توضیحات سایت کاملاً مطابقت داشت.', reply: 'رضای عزیز، ممنون از اعتماد شما! خوشحالیم که سفارشتان سریع و مطابق انتظار به دستتان رسید. 🍯' },
    { name: 'سارا محمدی', city: 'شیراز', rating: 5, text: 'بافت و عطرش عالیه. با چای و صبحانه ترکیب فوق‌العاده‌ای می‌سازه.' },
    { name: 'علی رضایی', city: 'تهران', rating: 4, text: 'کیفیت خیلی خوبه، فقط ای کاش سایز بزرگ‌تر هم داشت. در کل راضی‌ام.', reply: 'ممنون از بازخورد ارزشمندتان. پیشنهاد سایز بزرگ‌تر را به تیم نیکا منتقل کردیم.' },
    { name: 'نگار توکلی', city: 'ساری', rating: 5, text: 'برای هدیه گرفتم و همه خوششون اومد. بسته‌بندی بهداشتی و محکم بود.' },
    { name: 'حسین مرادی', city: 'تبریز', rating: 4, text: 'طعمش اصیل و طبیعیه، بعد از چند هفته کمی بلوره شد که نشونه‌ی خالص بودنشه.' },
  ];
  const reviewsKey = 'nika_reviews_' + productKey;
  const loadUserReviews = () => {
    try {
      const v = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
      if (!Array.isArray(v)) return [];
      let migrated = false;
      v.forEach((r, i) => { if (!r.id) { r.id = 'u' + Date.now() + '-' + i; migrated = true; } });
      if (migrated) { try { localStorage.setItem(reviewsKey, JSON.stringify(v)); } catch (err) {} }
      return v;
    } catch (err) { return []; }
  };
  /* ---------- پاسخ به نظرات: ذخیره‌ی محلی، کلید = شناسه‌ی نظر ---------- */
  const repliesKey = 'nika_review_replies_' + productKey;
  const loadReplies = () => {
    try { const v = JSON.parse(localStorage.getItem(repliesKey) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (err) { return {}; }
  };
  const saveReplies = (obj) => {
    try { localStorage.setItem(repliesKey, JSON.stringify(obj)); return true; } catch (err) { return false; }
  };
  const getSessionUser = () => {
    try { const u = JSON.parse(localStorage.getItem('nika_session_cache') || 'null'); return u && typeof u === 'object' ? u : null; } catch (err) { return null; }
  };
  let openReplyFor = null;
  const saveUserReviews = (list) => {
    try { localStorage.setItem(reviewsKey, JSON.stringify(list)); return true; } catch (err) { return false; }
  };
  const escapeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const starsMarkup = (n) => {
    let out = '';
    for (let i = 1; i <= 5; i++) out += '<svg class="icon icon-sm' + (i <= n ? '' : ' star-off') + '"><use href="#i-star"/></svg>';
    return out;
  };
  // هر محصول یک زیرمجموعه‌ی ثابت اما متفاوت از نظرات نمونه می‌گیرد
  const poolOffset = productKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % REVIEW_POOL.length;
  const seededReviews = [0, 1, 2, 3].map(i => { const idx = (poolOffset + i) % REVIEW_POOL.length; return { ...REVIEW_POOL[idx], id: 'p' + idx }; });

  const renderReviews = () => {
    const mine = loadUserReviews().map(r => ({ ...r, isNew: true }));
    const all = [...mine, ...seededReviews];
    const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
    const avgFa = toFa(avg.toFixed(1)).replace('.', '٫');

    document.getElementById('rvCount').textContent = toFa(all.length);
    document.getElementById('pdReviewsTabBtn').textContent = 'نظرات کاربران (' + toFa(all.length) + ')';
    document.getElementById('pdRatingText').textContent = avgFa + ' از ۵ (' + toFa(all.length) + ' نظر)';
    document.getElementById('rvSummary').innerHTML =
      '<span class="rv-avg">' + avgFa + '</span>' +
      '<span class="stars">' + starsMarkup(Math.round(avg)) + '</span>' +
      '<span class="rv-avg-note">میانگین امتیاز از ' + toFa(all.length) + ' نظر</span>';
    const stored = loadReplies();
    const dateFa = (ts) => { try { return new Date(ts).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (err) { return ''; } };
    const replyItem = (rp) =>
      '<div class="rv-reply' + (rp.staff ? ' is-staff' : '') + '">' +
        '<span class="avatar rv-reply-avatar">' + escapeHtml((rp.name || '?').trim().charAt(0)) + '</span>' +
        '<div class="rv-reply-body">' +
          '<div class="rv-reply-meta"><strong>' + escapeHtml(rp.name) + '</strong>' +
          (rp.staff ? '<span class="rv-staff-badge">پاسخ نیکا</span>' : '') +
          (rp.ts ? '<small>' + escapeHtml(dateFa(rp.ts)) + '</small>' : '') + '</div>' +
          '<p>' + escapeHtml(rp.text) + '</p>' +
        '</div>' +
      '</div>';
    const me = getSessionUser();
    document.getElementById('rvList').innerHTML = all.map(r => {
      const replies = [];
      if (r.reply) replies.push({ name: 'پشتیبانی نیکا', text: r.reply, staff: true });
      (stored[r.id] || []).forEach(x => replies.push(x));
      const isOpen = openReplyFor === r.id;
      return '<article class="testi-card rv-card" data-rid="' + escapeHtml(r.id) + '">' +
        '<div class="testi-top"><div class="stars">' + starsMarkup(r.rating) + '</div>' +
        (r.isNew ? '<span class="rv-new">نظر شما</span>' : '') + '</div>' +
        '<p>' + escapeHtml(r.text) + '</p>' +
        '<div class="testi-user"><span class="avatar">' + escapeHtml((r.name || '?').trim().charAt(0)) + '</span>' +
        '<span class="testi-user-info"><strong>' + escapeHtml(r.name) + '</strong><small>' + escapeHtml(r.city || '') + '</small></span>' +
        '<button type="button" class="rv-reply-btn' + (isOpen ? ' is-open' : '') + '" data-reply-toggle="' + escapeHtml(r.id) + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
          '<svg class="icon icon-sm"><use href="#i-chev-left"/></svg><span>پاسخ' + (replies.length ? ' (' + toFa(replies.length) + ')' : '') + '</span></button></div>' +
        (replies.length ? '<div class="rv-replies">' + replies.map(replyItem).join('') + '</div>' : '') +
        (isOpen ?
          '<form class="rv-reply-form" data-reply-form="' + escapeHtml(r.id) + '" novalidate>' +
            (me && me.name ? '<div class="rv-reply-as">پاسخ به‌عنوان <strong>' + escapeHtml(me.name) + '</strong></div>'
                           : '<input type="text" name="rname" maxlength="40" placeholder="نام شما" autocomplete="name" aria-label="نام شما">') +
            '<textarea name="rtext" rows="3" maxlength="400" placeholder="پاسخ خود را بنویسید..." aria-label="متن پاسخ"></textarea>' +
            '<p class="rv-error" role="alert" hidden></p>' +
            '<div class="rv-reply-actions"><button type="submit" class="btn btn-gold btn-sm"><span>ارسال پاسخ</span></button>' +
            '<button type="button" class="rv-reply-cancel" data-reply-cancel="1">انصراف</button></div>' +
          '</form>' : '') +
      '</article>';
    }).join('');
    if (openReplyFor) {
      const ta = document.querySelector('[data-reply-form="' + openReplyFor + '"] textarea');
      if (ta && ta.dataset.focused !== '1') { ta.dataset.focused = '1'; ta.focus({ preventScroll: true }); }
    }
  };

  const rvListEl = document.getElementById('rvList');
  rvListEl.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-reply-toggle]');
    if (toggle) {
      const id = toggle.getAttribute('data-reply-toggle');
      openReplyFor = openReplyFor === id ? null : id;
      renderReviews();
      return;
    }
    if (e.target.closest('[data-reply-cancel]')) { openReplyFor = null; renderReviews(); }
  });
  rvListEl.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-reply-form]');
    if (!form) return;
    e.preventDefault();
    const id = form.getAttribute('data-reply-form');
    const me = getSessionUser();
    const name = me && me.name ? String(me.name).trim() : (form.elements.rname ? form.elements.rname.value.trim() : '');
    const text = form.elements.rtext.value.trim();
    const err = form.querySelector('.rv-error');
    const fail = (msg) => { err.textContent = msg; err.hidden = false; };
    if (name.length < 2) return fail('لطفاً نام خود را وارد کنید.');
    if (text.length < 2) return fail('متن پاسخ را بنویسید.');
    const all = loadReplies();
    const list = all[id] || [];
    list.push({ id: 'r' + Date.now(), name, text, ts: Date.now(), staff: !!(me && me.role === 'admin') });
    all[id] = list.slice(-30);
    saveReplies(all);
    openReplyFor = null;
    renderReviews();
    showToast('✅ پاسخ شما ثبت شد.');
  });

  const switchReviewTab = (which) => {
    document.querySelectorAll('.rv-subtab').forEach(b => {
      const on = b.dataset.rv === which;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.rv-panel').forEach(p => p.classList.toggle('active', p.id === 'rv-' + which));
  };
  document.querySelectorAll('.rv-subtab').forEach(b => b.addEventListener('click', () => switchReviewTab(b.dataset.rv)));

  let pickedRating = 0;
  const starButtons = document.querySelectorAll('#rvStarPick button');
  const paintStars = (n) => starButtons.forEach(b => b.classList.toggle('on', Number(b.dataset.value) <= n));
  starButtons.forEach(b => {
    b.addEventListener('click', () => { pickedRating = Number(b.dataset.value); paintStars(pickedRating); });
    b.addEventListener('mouseenter', () => paintStars(Number(b.dataset.value)));
  });
  document.getElementById('rvStarPick')?.addEventListener('mouseleave', () => paintStars(pickedRating));

  const rvError = document.getElementById('rvError');
  const showRvError = (msg) => { rvError.textContent = msg; rvError.hidden = !msg; };
  document.getElementById('rvForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('rvName').value.trim();
    const city = document.getElementById('rvCity').value.trim();
    const text = document.getElementById('rvText').value.trim();
    if (!pickedRating) return showRvError('لطفاً امتیاز خود را انتخاب کنید.');
    if (name.length < 2) return showRvError('لطفاً نام خود را وارد کنید.');
    if (text.length < 10) return showRvError('متن نظر باید حداقل ۱۰ حرف باشد.');
    showRvError('');
    const list = loadUserReviews();
    list.unshift({ name, city, rating: pickedRating, text });
    saveUserReviews(list.slice(0, 20));
    e.target.reset();
    pickedRating = 0;
    paintStars(0);
    renderReviews();
    switchReviewTab('list');
    showToast('✅ نظر شما ثبت شد. ممنون از شما!');
  });

  renderReviews();

});
`;

export default bodyScript;
