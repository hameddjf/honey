"use client";

import { useEffect, useState } from "react";
import { ICON_SPRITE } from "../app/_shared/chrome";
import { getAdminSession, adminLogout } from "@/lib/adminAuthClient";

const NAV = [
  { href: "/nika-x7q2", label: "داشبورد", icon: "i-grid", exact: true },
  { href: "/nika-x7q2/products", label: "محصولات", icon: "i-box" },
  { href: "/nika-x7q2/orders", label: "سفارش‌ها", icon: "i-truck" },
  { href: "/nika-x7q2/content", label: "محتوای سایت", icon: "i-edit" },
  { href: "/nika-x7q2/users", label: "کاربران", icon: "i-user" },
];

export default function AdminLayout({ active, children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | denied
  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const admin = await getAdminSession();
      if (!admin) {
        setStatus("denied");
        const next = typeof window !== "undefined" ? window.location.pathname : "/nika-x7q2";
        window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
        return;
      }
      setSession(admin);
      setStatus("ok");
    })();
  }, []);

  if (status !== "ok") {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
        <div className="admin-guard-loading">
          {status === "checking" ? "در حال بررسی دسترسی..." : "دسترسی ندارید — در حال انتقال به ورود..."}
        </div>
      </>
    );
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <a href="/" className="admin-brand">
            <span className="logo-mark">
              <svg className="icon"><use href="#i-hexframe" /></svg>
              <svg className="icon logo-bee"><use href="#i-bee" /></svg>
            </span>
            <span className="admin-brand-text">
              عسل طبیعی نیکا
              <small>پنل مدیریت</small>
            </span>
          </a>

          <div className="admin-user-box">
            <span className="avatar">{session.name?.slice(0, 1) || "م"}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fff" }}>{session.name}</div>
              <div style={{ color: "#B7A98A" }} dir="ltr">{session.mobile}</div>
            </div>
          </div>

          <nav className="admin-nav">
            {NAV.map((item) => {
              const isActive = item.exact ? active === item.href : active?.startsWith(item.href);
              return (
                <a key={item.href} href={item.href} className={isActive ? "active" : ""}>
                  <svg className="icon"><use href={`#${item.icon}`} /></svg>
                  {item.label}
                </a>
              );
            })}
            <div className="admin-nav-sep" />
            <a href="/">
              <svg className="icon"><use href="#i-home" /></svg>
              بازگشت به سایت
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                adminLogout().then(() => {
                  window.location.href = "/";
                });
              }}
            >
              <svg className="icon"><use href="#i-logout" /></svg>
              خروج از حساب
            </a>
          </nav>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
