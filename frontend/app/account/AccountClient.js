"use client";

import { useEffect, useRef, useState } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";
import { getSession, logout, changePassword, refreshSession, updateProfile as apiUpdateProfile } from "@/lib/auth";
import { listMyOrders, mapOrder, STATUS_LABEL as API_STATUS_LABEL } from "@/lib/api/orders";
import { listAddresses, createAddress, deleteAddress, setDefaultAddress } from "@/lib/api/addresses";

const ORDER_HISTORY_KEY = "nika_order_history";
const PROFILE_KEY = "nika_profile";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

const DEFAULT_PROFILE = { name: "سارا محمدی", email: "sara.mohammadi@example.com", phone: "۰۹۱۲۱۲۳۴۵۶۷" };

const STATUS_LABEL = API_STATUS_LABEL;

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
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "", city: "", detail: "", postal_code: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const session = getSession();
    if (!session) {
      window.location.href = "/login?next=/account";
      return;
    }

    // پروفایل را ابتدا از سشن کش‌شده seed می‌کنیم، سپس با /accounts/me/ تازه می‌کنیم.
    setProfile({ ...DEFAULT_PROFILE, name: session.name, email: session.email, phone: session.phone || "" });
    setProfileDraft({ ...DEFAULT_PROFILE, name: session.name, email: session.email, phone: session.phone || "" });

    refreshSession().then((fresh) => {
      if (cancelled || !fresh) return;
      const p = { name: fresh.name, email: fresh.email, phone: fresh.phone || "" };
      setProfile(p);
      setProfileDraft(p);
    });

    // تاریخچه‌ی سفارش‌ها همیشه از بک‌اند جنگو خوانده می‌شود، نه localStorage.
    listMyOrders()
      .then((data) => {
        if (cancelled) return;
        const results = (data && data.results) || [];
        setOrders(results.map((o) => mapOrder(o)));
      })
      .catch(() => {
        if (cancelled) return;
        setOrdersError("بارگذاری سفارش‌ها ناموفق بود.");
        setOrders(readJSON(ORDER_HISTORY_KEY, []));
      })
      .finally(() => !cancelled && setOrdersLoading(false));

    // آدرس‌های ذخیره‌شده هم از بک‌اند خوانده می‌شوند (نه localStorage).
    listAddresses()
      .then((list) => {
        if (cancelled) return;
        setAddresses(list);
      })
      .catch(() => {
        if (cancelled) return;
        setAddressesError("بارگذاری آدرس‌ها ناموفق بود.");
      })
      .finally(() => !cancelled && setAddressesLoading(false));

    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab");
    if (initialTab && TABS.some((t) => t.id === initialTab)) setTab(initialTab);
    setMounted(true);

    return () => {
      cancelled = true;
    };
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
    window.location.href = `/invoice/${order.id}`;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavedMsg("");
    const result = await apiUpdateProfile(null, { name: profileDraft.name, phone: profileDraft.phone });
    if (!result.ok) {
      setSavedMsg("❌ " + result.error);
      return;
    }
    setProfile((p) => ({ ...p, name: result.session.name, phone: result.session.phone }));
    setSavedMsg("✅ تغییرات پروفایل ذخیره شد");
    setTimeout(() => setSavedMsg(""), 2600);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSaved(false);
    if (pwd.next !== pwd.confirm) {
      setPwdError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }
    const session = getSession();
    if (!session) return;
    const result = await changePassword(session.email, pwd.current, pwd.next);
    if (!result.ok) {
      setPwdError(result.error);
      return;
    }
    setPwd({ current: "", next: "", confirm: "" });
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 2600);
  };

  const addAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.title.trim() || !newAddress.city.trim() || !newAddress.detail.trim()) return;
    try {
      const created = await createAddress(newAddress);
      setAddresses((list) => [...list, created]);
      setNewAddress({ title: "", city: "", detail: "", postal_code: "" });
      setShowAddForm(false);
    } catch {
      setAddressesError("افزودن آدرس ناموفق بود.");
    }
  };

  const removeAddress = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((list) => list.filter((a) => a.id !== id));
    } catch {
      setAddressesError("حذف آدرس ناموفق بود.");
    }
  };

  const makeDefaultAddress = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses((list) => list.map((a) => ({ ...a, is_default: a.id === id })));
    } catch {
      setAddressesError("تنظیم آدرس پیش‌فرض ناموفق بود.");
    }
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
      <PublicTopbarHeader />
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
              <p className="hint">تاریخچه‌ی سفارش‌های شما (از سرور).</p>
              {ordersError && <p style={{ color: "#B5452F", fontSize: 13 }}>{ordersError}</p>}

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

              {ordersLoading ? (
                <div className="account-empty">
                  <p>در حال بارگذاری سفارش‌ها...</p>
                </div>
              ) : orders.length === 0 ? (
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
                  <input id="pEmail" type="email" value={profileDraft.email} disabled title="تغییر ایمیل از این طریق پشتیبانی نمی‌شود" />
                </div>
                {savedMsg && <p style={{ color: "#2F7D45", fontSize: 13, marginBottom: 14 }}>{savedMsg}</p>}
                <button type="submit" className="btn btn-gold">
                  <svg className="icon icon-sm"><use href="#i-edit" /></svg>
                  <span>ذخیره تغییرات</span>
                </button>
              </form>

              <h2 style={{ marginTop: 34 }}>تغییر رمز عبور</h2>
              <p className="hint">برای امنیت حساب، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید.</p>
              <form onSubmit={savePassword}>
                <div className="form-field">
                  <label htmlFor="pwdCurrent">رمز عبور فعلی</label>
                  <input
                    id="pwdCurrent"
                    type="password"
                    required
                    value={pwd.current}
                    onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="pwdNext">رمز عبور جدید</label>
                    <input
                      id="pwdNext"
                      type="password"
                      required
                      value={pwd.next}
                      onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="pwdConfirm">تکرار رمز عبور جدید</label>
                    <input
                      id="pwdConfirm"
                      type="password"
                      required
                      value={pwd.confirm}
                      onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                </div>
                {pwdError && <p style={{ color: "#B5452F", fontSize: 13, marginBottom: 14 }}>{pwdError}</p>}
                {pwdSaved && <p style={{ color: "#2F7D45", fontSize: 13, marginBottom: 14 }}>✅ رمز عبور تغییر کرد</p>}
                <button type="submit" className="btn btn-gold">
                  <svg className="icon icon-sm"><use href="#i-lock" /></svg>
                  <span>تغییر رمز عبور</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>آدرس‌های من</h2>
              <p className="hint">آدرس‌های ارسال سفارش خود را مدیریت کنید.</p>
              {addressesError && <p style={{ color: "#B5452F", fontSize: 13 }}>{addressesError}</p>}

              {addressesLoading ? (
                <div className="account-empty">
                  <p>در حال بارگذاری آدرس‌ها...</p>
                </div>
              ) : (
                addresses.map((a) => (
                  <div className="address-card" key={a.id}>
                    <div>
                      <h4>
                        {a.title}
                        {a.is_default && <span className="tag-default">پیش‌فرض</span>}
                      </h4>
                      <p>
                        {a.city} — {a.detail}
                        {a.postal_code ? ` (کدپستی: ${a.postal_code})` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {!a.is_default && (
                        <button
                          type="button"
                          className="btn"
                          style={{ border: "1px solid var(--border)", background: "var(--white)", padding: "6px 12px", fontSize: 12 }}
                          onClick={() => makeDefaultAddress(a.id)}
                        >
                          تنظیم به‌عنوان پیش‌فرض
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="حذف آدرس"
                        onClick={() => removeAddress(a.id)}
                      >
                        <svg className="icon"><use href="#i-trash" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}

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
                  <div className="form-field">
                    <label htmlFor="aPostal">کد پستی</label>
                    <input id="aPostal" type="text" placeholder="۱۲۳۴۵۶۷۸۹۰" value={newAddress.postal_code} onChange={(e) => setNewAddress((f) => ({ ...f, postal_code: e.target.value }))} />
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

      <PublicFooter />
    </>
  );
}
