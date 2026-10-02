// Auto-extracted verbatim markup/script from the original demo HTML (with routing fixes)
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function buildBodyHTML(content = DEFAULT_SITE_CONTENT) {
  return `

<!-- ============ ICON SPRITE ============ -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-cart" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="20.5" r="1.4" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4.5 20c1.4-3.8 4.4-5.8 7.5-5.8s6.1 2 7.5 5.8"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="20" y1="20" x2="15.8" y2="15.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-chev-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></symbol>
  <symbol id="i-chev-left" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6"/></symbol>
  <symbol id="i-chev-right" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.9 6.3 6.9.7-5.2 4.6 1.6 6.8L12 17.6 5.8 20.9l1.6-6.8-5.2-4.6 6.9-.7z"/></symbol>
  <symbol id="i-quote" viewBox="0 0 24 24"><path fill="currentColor" d="M3 10.5C3 6.9 5.7 4 9.7 3.4l.6 1.9c-2.3.6-3.6 2-3.8 3.7.3-.1.6-.2 1-.2 1.7 0 3 1.3 3 3S9.2 15 7.4 15C4.9 15 3 13 3 10.5zm10.3 0c0-3.6 2.7-6.5 6.7-7.1l.6 1.9c-2.3.6-3.6 2-3.8 3.7.3-.1.6-.2 1-.2 1.7 0 3 1.3 3 3s-1.3 3.2-3.1 3.2c-2.5 0-4.4-2-4.4-4.5z"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.2 1.1z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3.5 6.5L12 13l8.5-6.5"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 21.5s7-6.2 7-11.8a7 7 0 1 0-14 0c0 5.6 7 11.8 7 11.8z"/><circle cx="12" cy="9.6" r="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></symbol>
  <symbol id="i-telegram" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="M21 4L2.5 11.4l6 2 2 6.4 3-4 4.4 3.4z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M8.5 13.4L21 4"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 20l1.3-3.8A8 8 0 1 1 8.4 19z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9 9.6c0 3.6 2.8 6.4 6.4 6.4.6 0 1-.5.9-1.1l-.3-1.2a.9.9 0 0 0-1-.6l-1.1.2a5 5 0 0 1-2.8-2.8l.2-1.1a.9.9 0 0 0-.6-1L9.5 8c-.6-.1-1.1.3-1.1.9"/></symbol>
  <symbol id="i-truck" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M2 6h11v10H2z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M13 10h4l4 3.2V16h-8z"/><circle cx="6.5" cy="18" r="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="1.7" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
  <symbol id="i-leaf" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M20 4C9 4 4 9 4 18c9 0 14-5 14-14z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M5 19L14 10"/></symbol>
  <symbol id="i-medal" viewBox="0 0 24 24"><circle cx="12" cy="9.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M9 14l-2.2 6.5L12 18l5.2 2.5L15 14"/><path fill="none" stroke="currentColor" stroke-width="1.4" d="M12 6.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z"/></symbol>
  <symbol id="i-bee" viewBox="0 0 32 32"><ellipse cx="16" cy="18" rx="7" ry="8.5" fill="#241505"/><path d="M9.2 14.5h13.6M9 18h14M9.6 21.5h12.8" stroke="#E8B23D" stroke-width="2.1" stroke-linecap="round"/><circle cx="16" cy="9" r="3.4" fill="#241505"/><path d="M10 12c-3-2-6.5-1.5-8 .5 2 2 5.5 2.2 8 .3M22 12c3-2 6.5-1.5 8 .5-2 2-5.5 2.2-8 .3" fill="none" stroke="#241505" stroke-width="1.4" opacity=".55"/><path d="M16 5.5c-1.4-2.4-.6-4 1-4.7M16 5.5c1.4-2.4.6-4-1-4.7" stroke="#241505" stroke-width="1.3" fill="none" stroke-linecap="round"/></symbol>
  <symbol id="i-hexframe" viewBox="0 0 100 100"><polygon points="50,3 93,26.5 93,73.5 50,97 7,73.5 7,26.5" fill="none" stroke="currentColor" stroke-width="3"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 20.5s-7.8-4.9-10-9.7C.4 7 2.4 3.8 5.8 3.3c2-.3 3.9.6 5 2.2a1 1 0 0 0 1.6 0c1.1-1.6 3-2.5 5-2.2 3.4.5 5.4 3.7 3.8 7.5-2.2 4.8-10 9.7-10 9.7z"/></symbol>
  <symbol id="i-drop" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 2.5S5.5 10.4 5.5 15a6.5 6.5 0 0 0 13 0c0-4.6-6.5-12.5-6.5-12.5z"/></symbol>
  <symbol id="i-zap" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 2.5 20 6v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.2l2.3 2.3 4.7-4.7"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a7 7 0 0 0 11.3 11.3z"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 5l14 14M19 5L5 19"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" d="M4 11.5 12 4l8 7.5"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
  <symbol id="i-trash" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4.5 6.5h15M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.5 6.5l.8 12.4a1.8 1.8 0 0 0 1.8 1.7h5.8a1.8 1.8 0 0 0 1.8-1.7l.8-12.4"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M10.3 10.5v6M13.7 10.5v6"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 12h14"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6.5 8h11l1 12.2a1.6 1.6 0 0 1-1.6 1.8H7.1a1.6 1.6 0 0 1-1.6-1.8z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 8V6.5a3 3 0 0 1 6 0V8"/></symbol>
</svg>


<!-- ============ TOP BAR ============ -->
<div class="topbar">
  <div class="topbar-inner${content.topbar.active && content.topbar.message ? " has-message" : ""}">
    ${content.topbar.active && content.topbar.message ? `<p class="topbar-message">${content.topbar.message}</p>` : ""}
    <ul class="topbar-social">
      <li><a href="${content.footer.instagram}" aria-label="اینستاگرام"><svg class="icon"><use href="#i-instagram"/></svg></a></li>
      <li><a href="${content.footer.telegram}" aria-label="تلگرام"><svg class="icon"><use href="#i-telegram"/></svg></a></li>
      <li><a href="${content.footer.whatsapp}" aria-label="واتساپ"><svg class="icon"><use href="#i-whatsapp"/></svg></a></li>
    </ul>
  </div>
</div>

<!-- ============ HEADER ============ -->
<header class="site-header" id="siteHeader">
  <div class="header-inner container">

    <a href="/" class="logo" aria-label="عسل طبیعی نیکا - صفحه اصلی">
      <span class="logo-mark"><svg class="icon"><use href="#i-hexframe"/></svg><svg class="icon logo-bee"><use href="#i-bee"/></svg></span>
      <span class="logo-text">عسل طبیعی<strong>نیکا</strong></span>
    </a>

    <nav class="main-nav" id="mainNav">
      <ul>
        <li><a href="/">صفحه اصلی</a></li>
        <li class="has-dropdown">
          <a href="/shop">محصولات <svg class="icon icon-xs"><use href="#i-chev-down"/></svg></a>
          <ul class="dropdown">
            <li><a href="/product/citrus">عسل مرکبات</a></li>
            <li><a href="/product/dark">عسل سیاه تلو</a></li>
            <li><a href="/product/forest">عسل نمدار</a></li>
            <li><a href="/product/sunflower">عسل کلزا</a></li>
          </ul>
        </li>
        <li class="has-dropdown">
          <a href="/about">درباره ما <svg class="icon icon-xs"><use href="#i-chev-down"/></svg></a>
          <ul class="dropdown">
            <li><a href="/about#story">داستان نیکا</a></li>
            <li><a href="/about#beekeeping">زنبورداری ما</a></li>
          </ul>
        </li>
        <li><a href="/blog">وبلاگ</a></li>
        <li><a href="/contact">تماس با ما</a></li>
      </ul>
    </nav>

    <div class="header-actions">
      <label class="search-box">
        <svg class="icon"><use href="#i-search"/></svg>
        <input type="text" placeholder="جستجو در محصولات...">
      </label>
      <button class="icon-btn mobile-search-toggle" id="mobileSearchToggle" aria-label="جستجو"><svg class="icon"><use href="#i-search"/></svg></button>
      <a href="/account" class="icon-btn" aria-label="حساب کاربری"><svg class="icon"><use href="#i-user"/></svg></a>
      <a href="/cart" class="icon-btn" aria-label="سبد خرید"><svg class="icon"><use href="#i-cart"/></svg><span class="cart-badge">0</span></a>
      <button class="nav-toggle" id="navToggle" aria-label="باز کردن منو"><span></span><span></span><span></span></button>
    </div>

  </div>

  <div class="mobile-search-bar" id="mobileSearchBar">
    <label class="search-box search-box-mobile">
      <svg class="icon"><use href="#i-search"/></svg>
      <input type="text" placeholder="جستجو در محصولات...">
    </label>
  </div>
</header>


<section class="container">
  <div class="breadcrumb" style="justify-content:flex-start; margin-top:20px">
    <a href="/">خانه</a>
    <svg class="icon icon-xs"><use href="#i-chev-left"/></svg>
    <a href="/shop">فروشگاه</a>
    <svg class="icon icon-xs"><use href="#i-chev-left"/></svg>
    <a href="/shop" id="crumbCategory"></a>
    <svg class="icon icon-xs"><use href="#i-chev-left"/></svg>
    <span id="crumbTitle">محصول</span>
  </div>

  <div class="pd-layout">
    <div class="pd-gallery">
      <div class="pd-gallery-main">
        <img id="pdMainImg" src="" alt="">
        <span class="pd-emoji" id="pdEmoji"></span>
      </div>
      <div class="pd-gallery-thumbs" id="pdThumbs"></div>
    </div>

    <div class="pd-info">
      <span class="pd-category-chip" id="pdCategoryChip"></span>
      <span class="pd-tagline" id="pdTagline"></span>
      <h1 id="pdTitle"></h1>
      <div class="pd-rating">
        <span class="stars">
          <svg class="icon"><use href="#i-star"/></svg><svg class="icon"><use href="#i-star"/></svg><svg class="icon"><use href="#i-star"/></svg><svg class="icon"><use href="#i-star"/></svg><svg class="icon"><use href="#i-star"/></svg>
        </span>
        <span id="pdRatingText">۴.۸ از ۵</span>
      </div>
      <div class="pd-price-row">
        <span class="pd-price" id="pdPrice"></span><small>تومان</small>
        <small id="pdOldPrice" style="text-decoration:line-through; margin-inline-start:8px"></small>
      </div>
      <p class="pd-desc" id="pdDesc"></p>

      <h4 class="pd-benefits-heading">فواید و خواص</h4>
      <div class="pd-benefits-grid" id="pdBenefits"></div>

      <div class="pd-actions">
        <div class="qty-stepper" style="height:52px; flex-shrink:0">
          <button class="qty-minus" aria-label="کاهش تعداد" style="width:38px;height:100%"><svg class="icon"><use href="#i-minus"/></svg></button>
          <span id="pdQty" style="width:38px">۱</span>
          <button class="qty-plus" aria-label="افزایش تعداد" style="width:38px;height:100%"><svg class="icon"><use href="#i-plus"/></svg></button>
        </div>
        <button class="btn btn-gold" id="pdAddBtn"><span>افزودن به سبد خرید</span><svg class="icon icon-sm"><use href="#i-cart"/></svg></button>
        <button class="pd-wish-btn" id="pdWishBtn" aria-label="افزودن به علاقه‌مندی‌ها"><svg class="icon"><use href="#i-heart"/></svg></button>
      </div>

      <div class="pd-trust-mini">
        <div class="trust-item"><span class="trust-icon"><svg class="icon"><use href="#i-medal"/></svg></span><span class="trust-text"><strong>تضمین کیفیت</strong>کنترل کیفیت در تمام مراحل</span></div>
        <div class="trust-item"><span class="trust-icon"><svg class="icon"><use href="#i-leaf"/></svg></span><span class="trust-text"><strong>۱۰۰٪ طبیعی</strong>بدون افزودنی و نگهدارنده</span></div>
        <div class="trust-item"><span class="trust-icon"><svg class="icon"><use href="#i-truck"/></svg></span><span class="trust-text"><strong>ارسال سریع</strong>به سراسر ایران</span></div>
      </div>
    </div>
  </div>
</section>

<section class="container pd-tabs">
  <div class="pd-tab-buttons">
    <button class="active" data-tab="desc">توضیحات کامل</button>
    <button data-tab="spec">مشخصات محصول</button>
    <button data-tab="reviews" id="pdReviewsTabBtn">نظرات کاربران</button>
  </div>
  <div class="pd-tab-panel active" id="tab-desc"><p id="pdFullDesc"></p></div>
  <div class="pd-tab-panel" id="tab-spec">
    <table class="spec-table" id="specTable"></table>
  </div>
  <div class="pd-tab-panel" id="tab-reviews">
    <div class="rv-subtabs" role="tablist" aria-label="بخش نظرات">
      <button type="button" class="rv-subtab active" data-rv="list" role="tab" aria-selected="true">نظرات دریافتی <span class="rv-count" id="rvCount">۰</span></button>
      <button type="button" class="rv-subtab" data-rv="form" role="tab" aria-selected="false">ثبت نظر جدید</button>
    </div>

    <div class="rv-panel active" id="rv-list" role="tabpanel">
      <div class="rv-summary" id="rvSummary"></div>
      <div class="rv-list" id="rvList"></div>
    </div>

    <div class="rv-panel" id="rv-form" role="tabpanel">
      <form class="rv-form" id="rvForm" novalidate>
        <h4>نظر خود را درباره‌ی این محصول بنویسید</h4>
        <div class="rv-field">
          <label>امتیاز شما</label>
          <div class="rv-star-pick" id="rvStarPick" role="radiogroup" aria-label="امتیاز">
            <button type="button" data-value="1" aria-label="۱ ستاره"><svg class="icon"><use href="#i-star"/></svg></button>
            <button type="button" data-value="2" aria-label="۲ ستاره"><svg class="icon"><use href="#i-star"/></svg></button>
            <button type="button" data-value="3" aria-label="۳ ستاره"><svg class="icon"><use href="#i-star"/></svg></button>
            <button type="button" data-value="4" aria-label="۴ ستاره"><svg class="icon"><use href="#i-star"/></svg></button>
            <button type="button" data-value="5" aria-label="۵ ستاره"><svg class="icon"><use href="#i-star"/></svg></button>
          </div>
        </div>
        <div class="rv-row">
          <div class="rv-field">
            <label for="rvName">نام شما</label>
            <input type="text" id="rvName" maxlength="40" placeholder="مثلاً: سارا محمدی" autocomplete="name">
          </div>
          <div class="rv-field">
            <label for="rvCity">شهر (اختیاری)</label>
            <input type="text" id="rvCity" maxlength="30" placeholder="مثلاً: شیراز">
          </div>
        </div>
        <div class="rv-field">
          <label for="rvText">متن نظر</label>
          <textarea id="rvText" rows="5" maxlength="600" placeholder="تجربه‌ی خود را از طعم، کیفیت و بسته‌بندی بنویسید..."></textarea>
        </div>
        <p class="rv-error" id="rvError" role="alert" hidden></p>
        <button type="submit" class="btn btn-gold"><span>ثبت نظر</span></button>
      </form>
    </div>
  </div>
</section>

<section class="container related-section" style="padding-bottom:80px">
  <div class="related-head">
    <div class="related-titles">
      <span class="related-eyebrow">پیشنهاد نیکا</span>
      <h2 class="section-title related-heading" style="font-size:26px; text-align:right">محصولات پیشنهادی</h2>
      <p class="related-sub">طعم‌های دیگری که شاید به آن‌ها علاقه‌مند شوید</p>
    </div>
    <div class="slider-nav">
      <span class="slider-counter" id="relCounter" aria-live="polite"></span>
      <button type="button" class="slider-btn" id="relPrev" aria-label="قبلی"><svg class="icon"><use href="#i-chev-right"/></svg></button>
      <button type="button" class="slider-btn" id="relNext" aria-label="بعدی"><svg class="icon"><use href="#i-chev-left"/></svg></button>
    </div>
  </div>
  <div class="related-slider" id="relSlider">
    <div class="related-track" id="relatedGrid" tabindex="0" role="region" aria-roledescription="اسلایدر" aria-label="محصولات پیشنهادی"></div>
  </div>
  <div class="rel-progress" id="relProgress" role="presentation"><span class="rel-progress-thumb" id="relThumb"></span></div>
</section>

<div class="pd-mobile-cta">
  <div>
    <span class="pd-price" id="pdMobilePrice"></span>
    <small class="pd-mobile-cta-sub">تومان &middot; موجود در انبار</small>
  </div>
  <button class="btn btn-gold" id="pdMobileAddBtn"><span>افزودن به سبد</span><svg class="icon icon-sm"><use href="#i-cart"/></svg></button>
</div>

<!-- ============ FOOTER ============ -->
<footer id="footer">
  <div class="container footer-grid">

    <div class="footer-col footer-brand">
      <a href="/" class="logo logo-footer">
        <span class="logo-mark"><svg class="icon"><use href="#i-hexframe"/></svg><svg class="icon logo-bee"><use href="#i-bee"/></svg></span>
        <span class="logo-text">عسل طبیعی<strong>نیکا</strong></span>
      </a>
      <p>${content.footer.tagline}</p>
      <ul class="footer-contact">
        <li><svg class="icon icon-sm"><use href="#i-phone"/></svg><span dir="ltr">${content.footer.phone}</span></li>
        <li><svg class="icon icon-sm"><use href="#i-mail"/></svg><span dir="ltr">${content.footer.email}</span></li>
        <li><svg class="icon icon-sm"><use href="#i-pin"/></svg><span>${content.footer.address}</span></li>
      </ul>
    </div>

    <div class="footer-col footer-accordion">
      <h4><span>خدمات مشتریان</span><svg class="icon icon-sm accordion-chevron"><use href="#i-chev-down"/></svg></h4>
      <div class="footer-accordion-panel"><ul><li><a href="/faq">سوالات متداول</a></li><li><a href="/shipping">روش‌های ارسال</a></li><li><a href="/returns">شرایط بازگشت کالا</a></li><li><a href="/buying-guide">راهنمای خرید</a></li><li><a href="/account">پیگیری سفارش</a></li></ul></div>
    </div>

    <div class="footer-col footer-accordion">
      <h4><span>دسترسی سریع</span><svg class="icon icon-sm accordion-chevron"><use href="#i-chev-down"/></svg></h4>
      <div class="footer-accordion-panel"><ul><li><a href="/">صفحه اصلی</a></li><li><a href="/shop">محصولات</a></li><li><a href="/about">درباره ما</a></li><li><a href="/blog">وبلاگ</a></li><li><a href="/contact">تماس با ما</a></li></ul></div>
    </div>

    <div class="footer-col footer-newsletter">
      <h4>عضویت در خبرنامه</h4>
      <p>برای دریافت جدیدترین محصولات و تخفیف‌ها ایمیل خود را وارد کنید.</p>
      <form class="newsletter-form" id="newsletterForm">
        <input type="email" placeholder="ایمیل شما" required>
        <button type="submit">عضویت</button>
      </form>
      <ul class="footer-social">
        <li><a href="${content.footer.instagram}" aria-label="اینستاگرام"><svg class="icon icon-sm"><use href="#i-instagram"/></svg></a></li>
        <li><a href="${content.footer.telegram}" aria-label="تلگرام"><svg class="icon icon-sm"><use href="#i-telegram"/></svg></a></li>
        <li><a href="${content.footer.whatsapp}" aria-label="واتساپ"><svg class="icon icon-sm"><use href="#i-whatsapp"/></svg></a></li>
      </ul>
    </div>

  </div>

  <div class="container footer-trust">
    <div class="footer-trust-badge" title="جایگاه نماد اعتماد الکترونیکی — پس از دریافت از فروشگاه نصب می‌شود">
      <svg class="icon"><use href="#i-shield"/></svg>
      <div class="footer-trust-badge-text">
        <strong>نماد اعتماد الکترونیکی</strong>
        <span>جایگاه رزرو‌شده — نمونه</span>
      </div>
    </div>
    <p class="footer-trust-note">این جایگاه برای درج نماد اعتماد الکترونیکی رسمی فروشگاه در نظر گرفته شده و پس از دریافت مجوز رسمی، با نشان واقعی جایگزین می‌شود.</p>
  </div>

  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <p>طراحی شده با <span class="heart">♥</span> برای طبیعت و سلامت شما</p>
      <p>تمامی حقوق این سایت متعلق به عسل طبیعی نیکا می‌باشد.</p>
    </div>
  </div>
</footer>

<div class="toast" id="toast">با تشکر! عضویت شما ثبت شد 🐝</div>

<button class="back-to-top" id="backToTop" aria-label="بازگشت به بالا"><svg class="icon"><use href="#i-chev-down"/></svg></button>


<!-- ============ MOBILE BOTTOM NAV ============ -->
<nav class="mobile-bottom-nav" aria-label="منوی پایین موبایل">
  <ul>
    <li><a href="/"><svg class="icon"><use href="#i-home"/></svg><span>خانه</span></a></li>
    <li><a href="/shop"><svg class="icon"><use href="#i-grid"/></svg><span>فروشگاه</span></a></li>
    <li><a href="#" id="mbnSearch"><svg class="icon"><use href="#i-search"/></svg><span>جستجو</span></a></li>
    <li><a href="/cart"><svg class="icon"><use href="#i-cart"/></svg><span>سبد خرید</span><span class="mbn-badge">0</span></a></li>
    <li><a href="/account"><svg class="icon"><use href="#i-user"/></svg><span>حساب من</span></a></li>
  </ul>
</nav>


`;
}
