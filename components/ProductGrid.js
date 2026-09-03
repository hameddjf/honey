"use client";

import { useEffect, useState } from "react";

const CART_KEY = "nika_cart";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addToCart(key) {
  const cart = readCart();
  const existing = cart.find((it) => it.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, qty: 1 });
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
  // با بج سبد خرید در هدر (که در commonScript مدیریت می‌شود) هماهنگ می‌شویم
  document.querySelectorAll(".cart-badge, .mbn-badge").forEach((b) => {
    b.textContent = String(cart.reduce((s, it) => s + it.qty, 0));
    b.classList.add("bump");
    setTimeout(() => b.classList.remove("bump"), 300);
  });
}

const priceNum = (p) =>
  parseInt(
    String(p)
      .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
      .replace(/[^0-9]/g, ""),
    10
  ) || 0;

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2800);
}

/**
 * variant="category" → کارت‌های ساده‌ی صفحه‌ی خانه (فقط تصویر + عنوان، لینک به صفحه‌ی محصول)
 * variant="shop"     → کارت‌های کامل صفحه‌ی فروشگاه (قیمت + دکمه‌ی افزودن به سبد + مرتب‌سازی)
 */
export default function ProductGrid({ variant = "shop", limit }) {
  const [products, setProducts] = useState(null); // null = در حال بارگذاری
  const [sort, setSort] = useState("default");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.ok ? data.products : []))
      .catch(() => setProducts([]));
  }, []);

  if (products === null) {
    return <div className={variant === "shop" ? "shop-grid" : "category-grid"}>در حال بارگذاری محصولات...</div>;
  }

  let list = [...products];
  if (limit) list = list.slice(0, limit);
  if (variant === "shop") {
    if (sort === "price-asc") list.sort((a, b) => priceNum(a.price) - priceNum(b.price));
    if (sort === "price-desc") list.sort((a, b) => priceNum(b.price) - priceNum(a.price));
  }

  if (variant === "category") {
    return (
      <div className="category-grid">
        {list.map((p) => (
          <article className="cat-card" key={p.slug} tabIndex={0}>
            <a href={`/product/${p.slug}`} style={{ display: "block" }}>
              <div className={`cat-media cat-${p.slug}`}>
                <img src={p.image} alt={p.title} loading="lazy" />
                <span className="cat-emoji">{p.emoji}</span>
              </div>
              <h3>{p.title}</h3>
            </a>
            <a className="cat-dot" href={`/product/${p.slug}`} aria-label="مشاهده کامل جزئیات محصول">
              <svg className="icon icon-xs"><use href="#i-chev-left" /></svg>
            </a>
          </article>
        ))}
      </div>
    );
  }

  // variant === "shop"
  return (
    <section className="container">
      <div className="shop-toolbar">
        <p className="shop-count">
          <strong>{toFa(list.length)}</strong> محصول یافت شد
        </p>
        <label className="shop-sort">
          مرتب‌سازی:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">پیش‌فرض</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
          </select>
        </label>
      </div>

      <div className="shop-grid">
        {list.map((p) => (
          <article className="product-card" key={p.slug}>
            <div className="product-card-media">
              <a href={`/product/${p.slug}`}>
                <img src={p.image} alt={p.title} loading="lazy" />
              </a>
              {p.badge && <span className="product-card-badge">{p.badge}</span>}
              <span className="product-card-emoji">{p.emoji}</span>
            </div>
            <div className="product-card-body">
              <span className="product-card-tagline">{p.tagline}</span>
              <h3>
                <a href={`/product/${p.slug}`}>{p.title}</a>
              </h3>
              <div className="product-card-footer">
                <div className="product-card-price">
                  <span>{p.price}</span>
                  <small>تومان</small>
                </div>
                <button
                  type="button"
                  className="product-card-add"
                  aria-label="افزودن به سبد"
                  onClick={() => {
                    addToCart(p.slug);
                    showToast("🛒 " + p.title + " به سبد خرید اضافه شد");
                  }}
                >
                  <svg className="icon"><use href="#i-cart" /></svg>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
