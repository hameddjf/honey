"use client";

import { useEffect, useRef, useState } from "react";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../_shared/chrome";
import { getSession, logout } from "@/lib/authClient";

const ORDER_HISTORY_KEY = "nika_order_history";
const LAST_ORDER_KEY = "nika_last_order";
const PROFILE_KEY = "nika_profile";
const ADDRESSES_KEY = "nika_addresses";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

const DEFAULT_PROFILE = { name: "سارا محمدی", email: "sara.mohammadi@example.com", phone: "۰۹۱۲۱۲۳۴۵۶۷" };
const DEFAULT_ADDRESSES = [
  { id: 1, title: "منزل", city: "تهران", detail: "خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲، واحد ۴", isDefault: true },
];

const STATUS_LABEL = {
  processing: { label: "در حال پردازش", cls: "processing" },
  shipped: { label: "ارسال شده", cls: "shipped" },
  delivered: { label: "تحویل داده شده", cls: "delivered" },
};

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const TABS = [
  { id: "orders", label: "سفارش‌های من", icon: "i-box" },
  { id: "profile", label: "پروفایل من", icon: "i-user" },
  { id: "addresses", label: "آدرس‌های من", icon: "i-pin" },
];

export default function AccountClient() {
  const scriptRanRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileDraft, setProfileDraft] = useState(DEFAULT_PROFILE);
  const [addresses, setAddresses] = useState(DEFAULT_ADDRESSES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "", city: "", detail: "" });
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        window.location.href = "/login?next=/account";
        return;
      }

      setOrders(readJSON(ORDER_HISTORY_KEY, []));
      // پروفایل رو با اطلاعات همون حسابی که واردش شدیم seed می‌کنیم (اگه قبلاً ویرایش نشده باشه)
      const savedProfile = readJSON(PROFILE_KEY, null);
      const p = savedProfile || { ...DEFAULT_PROFILE, name: session.name, email: session.email };
      setProfile(p);
      setProfileDraft(p);
      setAddresses(readJSON(ADDRESSES_KEY, DEFAULT_ADDRESSES));

      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab && TABS.some((t) => t.id === initialTab)) setTab(initialTab);
      setMounted(true);
    })();
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

  const openOrderDetail = (order) => {
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {}
    window.location.href = "/invoice";
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setProfile(profileDraft);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileDraft));
    } catch {}
    setSavedMsg("✅ تغییرات پروفایل ذخیره شد");
    setTimeout(() => setSavedMsg(""), 2600);
  };

  const persistAddresses = (list) => {
    setAddresses(list);
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
    } catch {}
  };

  const addAddress = (e) => {
    e.preventDefault();
    if (!newAddress.title.trim() || !newAddress.city.trim() || !newAddress.detail.trim()) return;
    const list = [...addresses, { id: Date.now(), ...newAddress, isDefault: addresses.length === 0 }];
    persistAddresses(list);
    setNewAddress({ title: "", city: "", detail: "" });
    setShowAddForm(false);
  };

  const removeAddress = (id) => {
    persistAddresses(addresses.filter((a) => a.id !== id));
  };

  const orderStatusFor = (order, index) => {
    if (order.status && STATUS_LABEL[order.status]) return STATUS_LABEL[order.status];
    // سازگاری با سفارش‌های قدیمی‌تر که فیلد status نداشتن
    if (index === 0) return STATUS_LABEL.processing;
    if (index === 1) return STATUS_LABEL.shipped;
    return STATUS_LABEL.delivered;
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE + TOPBAR + HEADER }} />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "حساب کاربری",
            desc: "سفارش‌ها، پروفایل و آدرس‌های خود را مدیریت کنید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/account", label: "حساب کاربری" },
            ],
          }),
        }}
      />

      <div className="container account-layout">
        <aside className="account-sidebar">
          <div className="account-user">
            <span className="avatar">{mounted ? profile.name.slice(0, 1) : "س"}</span>
            <div>
              <h4>{mounted ? profile.name : "..."}</h4>
              <p>{mounted ? profile.phone : ""}</p>
            </div>
          </div>
          <nav className="account-nav">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
                <svg className="icon"><use href={`#${t.icon}`} /></svg>
                {t.label}
              </button>
            ))}
            <button
              type="button"
              className="logout"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              <svg className="icon"><use href="#i-logout" /></svg>
              خروج از حساب
            </button>
          </nav>
        </aside>

        <section className="account-panel">
          {!mounted ? null : tab === "orders" ? (
            <>
              <h2>سفارش‌های من</h2>
              <p className="hint">تاریخچه‌ی سفارش‌هایی که در این مرورگر ثبت کرده‌اید (نسخه دمو).</p>

              <div className="account-stats">
                <div className="account-stat">
                  <b>{toFa(orders.length)}</b>
                  <span>تعداد سفارش</span>
                </div>
                <div className="account-stat">
                  <b>{formatToman(orders.reduce((s, o) => s + o.total, 0))}</b>
                  <span>مجموع خرید</span>
                </div>
                <div className="account-stat">
                  <b>{toFa(addresses.length)}</b>
                  <span>آدرس ثبت‌شده</span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="account-empty">
                  <svg className="icon"><use href="#i-box" /></svg>
                  <p>هنوز سفارشی ثبت نکرده‌اید.</p>
                  <a href="/shop" className="btn btn-gold" style={{ marginTop: 14 }}>
                    <span>مشاهده فروشگاه</span>
                  </a>
                </div>
              ) : (
                orders.map((o, i) => {
                  const status = orderStatusFor(o, i);
                  return (
                    <div className="order-row" key={o.id}>
                      <div className="oi">
                        <b>سفارش {o.id}</b>
                        <span>
                          {o.date} — {toFa(o.items.length)} قلم کالا
                        </span>
                      </div>
                      <b style={{ fontSize: 14 }}>{formatToman(o.total)}</b>
                      <span className={`order-status ${status.cls}`}>{status.label}</span>
                      <button type="button" className="btn" style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "8px 16px", fontSize: 12.5 }} onClick={() => openOrderDetail(o)}>
                        جزئیات و فاکتور
                      </button>
                    </div>
                  );
                })
              )}
            </>
          ) : tab === "profile" ? (
            <>
              <h2>پروفایل من</h2>
              <p className="hint">اطلاعات تماس خود را به‌روز نگه دارید.</p>
              <form onSubmit={saveProfile}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="pName">نام و نام خانوادگی</label>
                    <input id="pName" type="text" value={profileDraft.name} onChange={(e) => setProfileDraft((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="pPhone">شماره تماس</label>
                    <input id="pPhone" type="tel" value={profileDraft.phone} onChange={(e) => setProfileDraft((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="pEmail">ایمیل</label>
                  <input id="pEmail" type="email" value={profileDraft.email} onChange={(e) => setProfileDraft((f) => ({ ...f, email: e.target.value }))} />
                </div>
                {savedMsg && <p style={{ color: "#2F7D45", fontSize: 13, marginBottom: 14 }}>{savedMsg}</p>}
                <button type="submit" className="btn btn-gold">
                  <svg className="icon icon-sm"><use href="#i-edit" /></svg>
                  <span>ذخیره تغییرات</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>آدرس‌های من</h2>
              <p className="hint">آدرس‌های ارسال سفارش خود را مدیریت کنید.</p>

              {addresses.map((a) => (
                <div className="address-card" key={a.id}>
                  <div>
                    <h4>
                      {a.title}
                      {a.isDefault && <span className="tag-default">پیش‌فرض</span>}
                    </h4>
                    <p>
                      {a.city} — {a.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="حذف آدرس"
                    onClick={() => removeAddress(a.id)}
                  >
                    <svg className="icon"><use href="#i-trash" /></svg>
                  </button>
                </div>
              ))}

              {showAddForm ? (
                <form onSubmit={addAddress} style={{ marginTop: 10 }}>
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="aTitle">عنوان آدرس</label>
                      <input id="aTitle" type="text" placeholder="مثلاً محل کار" value={newAddress.title} onChange={(e) => setNewAddress((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="aCity">شهر</label>
                      <input id="aCity" type="text" placeholder="مثلاً اصفهان" value={newAddress.city} onChange={(e) => setNewAddress((f) => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="aDetail">آدرس کامل</label>
                    <textarea id="aDetail" placeholder="خیابان، کوچه، پلاک، واحد" value={newAddress.detail} onChange={(e) => setNewAddress((f) => ({ ...f, detail: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-gold">
                      <span>ذخیره آدرس</span>
                    </button>
                    <button type="button" className="btn" style={{ border: "1px solid var(--border)", background: "var(--white)" }} onClick={() => setShowAddForm(false)}>
                      <span>انصراف</span>
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" className="btn btn-gold" onClick={() => setShowAddForm(true)}>
                  <svg className="icon icon-sm"><use href="#i-plus" /></svg>
                  <span>افزودن آدرس جدید</span>
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <div dangerouslySetInnerHTML={{ __html: FOOTER }} />
    </>
  );
}
