"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProducts } from "@/lib/products";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/api/orders";
import { listAddresses } from "@/lib/api/addresses";
import { getStoreSettings, estimateShipping, DEFAULT_STORE_SETTINGS } from "@/lib/api/storeSettings";
import { ApiError } from "@/lib/api/client";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";

const CART_KEY = "nika_cart";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

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
  const [productsBySlug, setProductsBySlug] = useState(null); // null = loading
  const [session, setSession] = useState(null);
  const [payment, setPayment] = useState("online");
  const [storeSettings, setStoreSettings] = useState(null); // null = loading -> falls back to DEFAULT_STORE_SETTINGS
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    postal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(loadCart());
    const s = getSession();
    setSession(s);
    fetchProducts()
      .then(({ bySlug }) => setProductsBySlug(bySlug))
      .catch(() => setProductsBySlug({}));
    getStoreSettings()
      .then(setStoreSettings)
      .catch(() => setStoreSettings(DEFAULT_STORE_SETTINGS));

    if (s) {
      listAddresses()
        .then((list) => {
          setAddresses(list);
          const def = list.find((a) => a.is_default) || list[0];
          if (def) {
            setSelectedAddressId(String(def.id));
            setForm((f) => ({ ...f, city: def.city, address: def.detail, postal: def.postal_code || "" }));
          }
        })
        .catch(() => {});
    }
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

  // Live prices/stock come straight from the backend catalog — never from
  // client state — so the displayed total always matches what the server
  // will (re)compute at order-creation time.
  const items = useMemo(() => {
    if (!cart || !productsBySlug) return [];
    return cart
      .map(({ key, qty }) => {
        const p = productsBySlug[key];
        if (!p) return null;
        return { key, qty, product: p, lineTotal: p.priceValue * qty };
      })
      .filter(Boolean);
  }, [cart, productsBySlug]);

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  // Display estimate only, from the same settings/rule the backend uses
  // (StoreSettings) — the server always recomputes the authoritative
  // shipping_cost itself at order-creation time (orders/services.py).
  const shipping = estimateShipping(storeSettings || DEFAULT_STORE_SETTINGS, subtotal);
  const total = subtotal + shipping;
  const guestCheckoutEnabled = (storeSettings || DEFAULT_STORE_SETTINGS).guest_checkout_enabled;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
    if (!id) return;
    const addr = addresses.find((a) => String(a.id) === id);
    if (addr) setForm((f) => ({ ...f, city: addr.city, address: addr.detail, postal: addr.postal_code || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      setError("لطفاً فیلدهای ستاره‌دار را تکمیل کنید.");
      return;
    }
    if (!session && !form.email.trim()) {
      setError("برای ثبت سفارش بدون ورود به حساب، وارد کردن ایمیل الزامی است.");
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const shippingAddress = `${form.address}، ${form.city}${form.postal ? `، کدپستی ${form.postal}` : ""}`;
      const order = await createOrder({
        guestEmail: session ? "" : form.email.trim(),
        shippingAddress,
        contactPhone: form.phone.trim(),
        customerName: form.name.trim(),
        paymentMethod: payment,
        items: items.map((it) => ({ product_id: it.product.id, quantity: it.qty })),
      });

      try {
        localStorage.removeItem(CART_KEY);
      } catch {
        // ignore storage errors — the order was still created server-side
      }

      router.push(`/invoice/${order.order_number}`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        setError(err.message || "ثبت سفارش ناموفق بود.");
      } else {
        setError("ثبت سفارش ناموفق بود. اتصال خود را بررسی کنید.");
      }
    }
  };

  return (
    <>
      <PublicTopbarHeader />
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

      {cart === null || productsBySlug === null ? null : items.length === 0 ? (
        <div className="cart-empty">
          <svg className="icon"><use href="#i-bag" /></svg>
          <h2>سبد خرید شما خالی است</h2>
          <p>برای ادامه‌ی تسویه‌حساب، ابتدا چند محصول به سبد خرید اضافه کنید.</p>
          <a href="/shop" className="btn btn-gold">
            <span>مشاهده فروشگاه</span>
          </a>
        </div>
      ) : !session && !guestCheckoutEnabled ? (
        <div className="cart-empty">
          <svg className="icon"><use href="#i-lock" /></svg>
          <h2>ثبت سفارش مهمان غیرفعال است</h2>
          <p>برای تکمیل خرید، لطفاً ابتدا وارد حساب کاربری خود شوید.</p>
          <a href="/login?next=/checkout" className="btn btn-gold">
            <span>ورود به حساب کاربری</span>
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
              {session && addresses.length > 0 && (
                <div className="form-field">
                  <label htmlFor="coSavedAddress">استفاده از آدرس ذخیره‌شده</label>
                  <select id="coSavedAddress" value={selectedAddressId} onChange={(e) => handleSelectAddress(e.target.value)}>
                    <option value="">آدرس جدید وارد می‌کنم</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} — {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              {!session && (
                <div className="form-field">
                  <label htmlFor="coEmail">ایمیل (برای پیگیری سفارش) *</label>
                  <input id="coEmail" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange("email")} required />
                </div>
              )}
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
                    <div className="p-desc">در این نسخه‌ی MVP، درگاه پرداخت واقعی متصل نشده و هیچ تراکنش واقعی انجام نمی‌شود. سفارش تا تأیید پرداخت توسط تیم فروش، «پرداخت‌نشده» ثبت می‌شود.</div>
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
              <svg className="icon icon-xs"><use href="#i-shield" /></svg> مبلغ نهایی و موجودی کالا در لحظه‌ی ثبت سفارش توسط سرور بازبینی می‌شود
            </p>
          </aside>
        </form>
      )}

      <PublicFooter />
    </>
  );
}
