"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ICON_SPRITE } from "../app/_shared/chrome";
import { getSession, isAdmin, logout, refreshSession } from "@/lib/auth";
import { getEffectiveProducts } from "@/lib/adminProducts";
import { getOrders, getSettings } from "@/lib/adminStore";
import { ADMIN_NAV_GROUPS, isNavItemActive, getPageMeta } from "@/components/admin/nav";
import CommandPalette from "@/components/admin/CommandPalette";
import { ToastProvider } from "@/components/admin/ui";

// ============================== نشان‌های پویای سایدبار ==============================
// تعداد سفارش‌های «در حال پردازش» و تعداد کل محصولات — از همان منبع دادهٔ
// دموی موجود (adminStore / adminProducts) خوانده می‌شود، نه یک شمارندهٔ ساختگی.
function useSidebarBadges() {
  const [badges, setBadges] = useState({ orders: 0, products: 0 });

  useEffect(() => {
    const compute = () => {
      const orders = getOrders();
      const pending = orders.filter((o) => o.status === "processing").length;
      const products = getEffectiveProducts().length;
      setBadges({ orders: pending, products });
    };
    compute();
    window.addEventListener("focus", compute);
    const interval = setInterval(compute, 4000);
    return () => {
      window.removeEventListener("focus", compute);
      clearInterval(interval);
    };
  }, []);

  return badges;
}

function useNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const compute = () => {
      const settings = getSettings();
      const threshold = settings.general.lowStockThreshold ?? 10;
      const products = getEffectiveProducts();
      const lowStock = products.filter((p) => (p.stock ?? 0) <= threshold);
      const orders = getOrders();
      const processing = orders.filter((o) => o.status === "processing").slice(0, 3);

      const list = [
        ...processing.map((o) => ({
          id: `order-${o.id}`,
          icon: "i-truck",
          warn: false,
          text: (
            <>
              سفارش <b>{o.id}</b> در انتظار پردازش است.
            </>
          ),
          time: o.date,
        })),
        ...lowStock.slice(0, 3).map((p) => ({
          id: `stock-${p.slug}`,
          icon: "i-alert-triangle",
          warn: true,
          text: (
            <>
              موجودی <b>{p.title}</b> رو به اتمام است ({p.stock} عدد).
            </>
          ),
          time: "هم‌اکنون",
        })),
      ];
      setItems(list);
    };
    compute();
    const interval = setInterval(compute, 5000);
    return () => clearInterval(interval);
  }, []);

  return items;
}

export default function AdminLayout({ active, children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | denied
  const [session, setSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const activePath = active || pathname;
  const badges = useSidebarBadges();
  const notifications = useNotifications();
  const page = useMemo(() => getPageMeta(activePath), [activePath]);

  useEffect(() => {
    let cancelled = false;
    const s = getSession();
    if (!isAdmin(s)) {
      setStatus("denied");
      const next = typeof window !== "undefined" ? window.location.pathname : "/admin";
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    setSession(s);
    setStatus("ok");
    // اعتبارسنجی مجدد نقش staff روی سرور — کش محلی فقط برای رندر سریع است.
    refreshSession().then((fresh) => {
      if (cancelled) return;
      if (!isAdmin(fresh)) {
        setStatus("denied");
        window.location.href = "/login";
        return;
      }
      setSession(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key === "k" || e.key === "K";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (href) => {
    setCmdkOpen(false);
    setSidebarOpen(false);
    setNotifOpen(false);
    router.push(href);
  };

  if (status !== "ok") {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
        <div className="a-guard-loading">
          {status === "checking" ? "در حال بررسی دسترسی..." : "دسترسی ندارید — در حال انتقال به ورود..."}
        </div>
      </>
    );
  }

  return (
    <ToastProvider>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
      <div className="a-shell">
        <div className={`a-sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`a-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="a-sidebar-scroll">
            <div className="a-brand">
              <Link href="/" className="a-brand-left">
                <span className="logo-mark">
                  <svg className="icon"><use href="#i-hexframe" /></svg>
                  <svg className="icon logo-bee"><use href="#i-bee" /></svg>
                </span>
                <span className="a-brand-text">
                  عسل نیکا
                  <small>Nika Honey Admin V2</small>
                </span>
              </Link>
              <button type="button" className="a-sidebar-close" aria-label="بستن منو" onClick={() => setSidebarOpen(false)}>
                <svg className="icon icon-sm"><use href="#i-close" /></svg>
              </button>
            </div>

            <nav className="a-nav">
              {ADMIN_NAV_GROUPS.map((group) => (
                <div className="a-nav-group" key={group.label}>
                  <div className="a-nav-group-label">{group.label}</div>
                  <div className="a-nav-list">
                    {group.items.map((item) => {
                      const isActive = isNavItemActive(item, activePath);
                      const badgeValue = item.badge === "orders" ? badges.orders : item.badge === "products" ? badges.products : null;
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`a-nav-link ${isActive ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            goTo(item.href);
                          }}
                        >
                          <span className="a-nav-link-main">
                            <svg className="icon"><use href={`#${item.icon}`} /></svg>
                            <span className="label">{item.label}</span>
                          </span>
                          {item.tag && <span className="a-nav-tag">{item.tag}</span>}
                          {badgeValue !== null && badgeValue !== undefined && (
                            <span className={`a-nav-badge ${badgeValue === 0 ? "faint" : ""}`}>
                              {badgeValue.toLocaleString("fa-IR")}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="a-nav-sep" />
              <Link href="/" className="a-nav-link">
                <span className="a-nav-link-main">
                  <svg className="icon"><use href="#i-home" /></svg>
                  <span className="label">بازگشت به سایت</span>
                </span>
              </Link>
            </nav>
          </div>

          <div className="a-sidebar-profile">
            <button type="button" className="a-profile-btn" onClick={() => goTo("/admin/profile")}>
              <span className="a-profile-left">
                <span className="a-avatar">
                  {session.name?.slice(0, 1) || "م"}
                  <span className="a-avatar-dot" />
                </span>
                <span>
                  <div className="a-profile-name">{session.name}</div>
                  <div className="a-profile-role">{session.role === "admin" ? "مدیر فروشگاه" : "کاربر"}</div>
                </span>
              </span>
              <svg className="icon icon-sm"><use href="#i-chev-left" /></svg>
            </button>
            <button
              type="button"
              className="a-logout-btn"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              <svg className="icon icon-sm"><use href="#i-logout" /></svg>
              خروج از حساب
            </button>
          </div>
        </aside>

        <div className="a-main-col">
          <header className="a-topbar">
            <button type="button" className="a-topbar-menu-btn" aria-label="باز کردن منو" onClick={() => setSidebarOpen(true)}>
              <svg className="icon icon-sm"><use href="#i-menu" /></svg>
            </button>

            <div className="a-breadcrumb">
              <span className="a-breadcrumb-trail">
                {page?.group && <span>{page.group}</span>}
                {page?.group && <svg className="icon"><use href="#i-chev-left" /></svg>}
                <span>{page?.label}</span>
              </span>
              <span className="a-breadcrumb-title">{page?.label}</span>
            </div>

            <button type="button" className="a-topbar-search" onClick={() => setCmdkOpen(true)}>
              <svg className="icon"><use href="#i-search" /></svg>
              <span style={{ flex: 1, textAlign: "start" }}>جست‌وجو در پنل مدیریت…</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div className="a-topbar-actions">
              <button type="button" className="a-btn a-btn-gold a-quick-add" onClick={() => goTo("/admin/products?new=1")}>
                <svg className="icon"><use href="#i-plus" /></svg>
                <span>افزودن محصول</span>
              </button>

              <button type="button" className="a-icon-btn" aria-label="پالت فرمان" onClick={() => setCmdkOpen(true)}>
                <svg className="icon"><use href="#i-command" /></svg>
              </button>

              <div className="a-dropdown-wrap">
                <button
                  type="button"
                  className="a-icon-btn"
                  aria-label="اعلان‌ها"
                  onClick={() => setNotifOpen((v) => !v)}
                >
                  <svg className="icon"><use href="#i-bell" /></svg>
                  {notifications.length > 0 && <span className="dot" />}
                </button>
                {notifOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 75 }} onClick={() => setNotifOpen(false)} />
                    <div className="a-dropdown-panel">
                      <div className="a-dropdown-head">
                        <span>اعلان‌ها</span>
                        <span className="a-muted">{notifications.length.toLocaleString("fa-IR")} مورد</span>
                      </div>
                      <div className="a-dropdown-list">
                        {notifications.length === 0 ? (
                          <div className="a-dropdown-empty">فعلاً اعلان جدیدی نیست.</div>
                        ) : (
                          notifications.map((n) => (
                            <div className="a-notif-item" key={n.id}>
                              <span className={`a-notif-icon ${n.warn ? "warn" : ""}`}>
                                <svg className="icon icon-sm"><use href={`#${n.icon}`} /></svg>
                              </span>
                              <span className="a-notif-body">
                                {n.text}
                                <span className="a-notif-time">{n.time}</span>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="a-main">{children}</main>
        </div>
      </div>

      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} onNavigate={goTo} />
    </ToastProvider>
  );
}
