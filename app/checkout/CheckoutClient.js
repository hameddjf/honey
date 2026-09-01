"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS } from "@/lib/products";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../_shared/chrome";

const CART_KEY = "nika_cart";
const ORDER_KEY = "nika_last_order";
const FREE_SHIP_THRESHOLD = 1000000;
const SHIP_COST = 45000;

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;
const priceNum = (p) =>
  parseInt(
    p
      .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
      .replace(/[^0-9]/g, ""),
    10
  );

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CheckoutClient() {
  const router = useRouter();
  const scriptRanRef = useRef(false);
  const [cart, setCart] = useState(null); // null = loading
  const [payment, setPayment] = useState("online");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    postal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    return () => script.remove();
  }, []);

  const items = useMemo(() => {
    if (!cart) return [];
    return cart
      .map(({ key, qty }) => {
        const p = PRODUCTS[key];
        if (!p) return null;
        return { key, qty, product: p, lineTotal: priceNum(p.price) * qty };
      })
      .filter(Boolean);
  }, [cart]);

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const shipping = items.length === 0 ? 0 : subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_COST;
  const total = subtotal + shipping;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      setError("لطفاً فیلدهای ستاره‌دار را تکمیل کنید.");
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    const now = new Date();
    const order = {
      id: "NK-" + now.getTime().toString().slice(-7),
      date: now.toLocaleDateString("fa-IR"),
      time: now.toLocaleTimeString("fa-IR"),
      customer: { ...form },
      payment,
      items: items.map((it) => ({
        key: it.key,
        title: it.product.title,
        weight: it.product.weight,
        image: it.product.image,
        qty: it.qty,
        price: priceNum(it.product.price),
        lineTotal: it.lineTotal,
      })),
      subtotal,
      shipping,
      total,
    };

    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      // هم‌چنین در تاریخچه‌ی سفارش‌های دمو ذخیره می‌کنیم تا در «حساب کاربری» دیده شود
      const historyRaw = localStorage.getItem("nika_order_history");
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift(order);
      localStorage.setItem("nika_order_history", JSON.stringify(history.slice(0, 10)));
      localStorage.removeItem(CART_KEY);
    } catch {
      // ignore storage errors in demo
    }

    setTimeout(() => router.push("/invoice"), 500);
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE + TOPBAR + HEADER }} />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "تسویه‌حساب",
            desc: "اطلاعات ارسال و روش پرداخت خود را تکمیل کنید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/cart", label: "سبد خرید" },
              { href: "/checkout", label: "تسویه‌حساب" },
            ],
          }),
        }}
      />

      <div className="container">
        <div className="checkout-steps">
          <div className="checkout-step done"><span className="num">۱</span> سبد خرید</div>
          <div className="checkout-step-sep" />
          <div className="checkout-step active"><span className="num">۲</span> اطلاعات ارسال</div>
          <div className="checkout-step-sep" />
          <div className="checkout-step"><span className="num">۳</span> پرداخت</div>
        </div>
      </div>

      {cart === null ? null : items.length === 0 ? (
        <div className="cart-empty">
          <svg className="icon"><use href="#i-bag" /></svg>
          <h2>سبد خرید شما خالی است</h2>
          <p>برای ادامه‌ی تسویه‌حساب، ابتدا چند محصول به سبد خرید اضافه کنید.</p>
          <a href="/shop" className="btn btn-gold">
            <span>مشاهده فروشگاه</span>
          </a>
        </div>
      ) : (
        <form className="container checkout-layout" onSubmit={handleSubmit}>
          <div>
            <div className="checkout-section">
              <h3>
                <svg className="icon"><use href="#i-truck" /></svg>
                اطلاعات گیرنده و آدرس
              </h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="coName">نام و نام خانوادگی *</label>
                  <input id="coName" type="text" placeholder="مثلاً سارا محمدی" value={form.name} onChange={handleChange("name")} required />
                </div>
                <div className="form-field">
                  <label htmlFor="coPhone">شماره تماس *</label>
                  <input id="coPhone" type="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" value={form.phone} onChange={handleChange("phone")} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="coCity">شهر *</label>
                  <input id="coCity" type="text" placeholder="مثلاً تهران" value={form.city} onChange={handleChange("city")} required />
                </div>
                <div className="form-field">
                  <label htmlFor="coPostal">کد پستی</label>
                  <input id="coPostal" type="text" placeholder="۱۲۳۴۵۶۷۸۹۰" value={form.postal} onChange={handleChange("postal")} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="coAddress">آدرس کامل *</label>
                <textarea id="coAddress" placeholder="خیابان، کوچه، پلاک، واحد" value={form.address} onChange={handleChange("address")} required />
              </div>
            </div>

            <div className="checkout-section">
              <h3>
                <svg className="icon"><use href="#i-lock" /></svg>
                روش پرداخت
              </h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input type="radio" name="payment" checked={payment === "online"} onChange={() => setPayment("online")} />
                  <div>
                    <div className="p-title">پرداخت آنلاین (شبیه‌سازی درگاه بانکی)</div>
                    <div className="p-desc">در این نسخه‌ی دمو، هیچ تراکنش واقعی انجام نمی‌شود.</div>
                  </div>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                  <div>
                    <div className="p-title">پرداخت در محل</div>
                    <div className="p-desc">هزینه سفارش هنگام تحویل از شما دریافت می‌شود.</div>
                  </div>
                </label>
              </div>
              {error && <p style={{ color: "#B5452F", fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button type="submit" className="btn btn-gold cart-checkout-btn" disabled={submitting}>
                <span>{submitting ? "در حال ثبت سفارش..." : "ثبت سفارش و دریافت فاکتور"}</span>
                <svg className="icon icon-sm"><use href="#i-chev-left" /></svg>
              </button>
            </div>
          </div>

          <aside className="cart-summary">
            <h3>خلاصه سفارش</h3>
            {items.map((it) => (
              <div className="checkout-review-item" key={it.key}>
                <span>
                  {it.product.title} <b>× {toFa(it.qty)}</b>
                </span>
                <b>{formatToman(it.lineTotal)}</b>
              </div>
            ))}
            <div className="summary-row">
              <span>جمع کالاها</span>
              <span>{formatToman(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>هزینه ارسال</span>
              <span>{shipping === 0 ? "رایگان" : formatToman(shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>مبلغ نهایی</span>
              <span>{formatToman(total)}</span>
            </div>
            <p className="cart-safe-note">
              <svg className="icon icon-xs"><use href="#i-shield" /></svg> پرداخت امن و ضمانت اصالت کالا
            </p>
          </aside>
        </form>
      )}

      <div dangerouslySetInnerHTML={{ __html: FOOTER }} />
    </>
  );
}
