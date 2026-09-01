"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  {
    href: "/shop",
    label: "محصولات",
    dropdown: [
      { href: "/product/citrus", label: "عسل مرکبات" },
      { href: "/product/dark", label: "عسل سیاه تئو" },
      { href: "/product/forest", label: "عسل جنگل" },
      { href: "/product/sunflower", label: "عسل آفتابگردان" },
    ],
  },
  {
    href: "/about",
    label: "درباره ما",
    dropdown: [
      { href: "/about#story", label: "داستان نیکا" },
      { href: "/about#beekeeping", label: "زنبورداری ما" },
    ],
  },
  { href: "/blog", label: "وبلاگ" },
  { href: "/contact", label: "تماس با ما" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0];
  if (!base) return false;
  return pathname === base || pathname.startsWith(base + "/");
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const handleDropdownClick = (e, label) => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      e.preventDefault();
      setOpenDropdown((cur) => (cur === label ? null : label));
    }
  };

  return (
    <>
      {/* ============ TOP BAR ============ */}
      <div className="topbar">
        <div className="topbar-inner">
          <ul className="topbar-social">
            <li>
              <a href="#" aria-label="اینستاگرام">
                <svg className="icon"><use href="#i-instagram" /></svg>
              </a>
            </li>
            <li>
              <a href="#" aria-label="تلگرام">
                <svg className="icon"><use href="#i-telegram" /></svg>
              </a>
            </li>
            <li>
              <a href="#" aria-label="واتساپ">
                <svg className="icon"><use href="#i-whatsapp" /></svg>
              </a>
            </li>
          </ul>
          <p className="topbar-message">
            <svg className="icon icon-sm"><use href="#i-truck" /></svg> ارسال رایگان برای سفارش‌های بالای ۱٬۰۰۰٬۰۰۰ تومان
          </p>
        </div>
      </div>

      {/* ============ HEADER ============ */}
      <header className={`site-header${scrolled ? " scrolled" : ""}`} id="siteHeader">
        <div className="header-inner container">
          <a href="/" className="logo" aria-label="عسل طبیعی نیکا - صفحه اصلی">
            <span className="logo-mark">
              <svg className="icon"><use href="#i-hexframe" /></svg>
              <svg className="icon logo-bee"><use href="#i-bee" /></svg>
            </span>
            <span className="logo-text">
              عسل طبیعی<strong>نیکا</strong>
            </span>
          </a>

          <nav className={`main-nav${navOpen ? " open" : ""}`} id="mainNav">
            <ul>
              {NAV_LINKS.map((item) => (
                <li
                  key={item.href}
                  className={
                    (item.dropdown ? "has-dropdown" : "") +
                    (item.dropdown && openDropdown === item.label ? " open" : "")
                  }
                >
                  <a
                    href={item.href}
                    className={isActive(pathname, item.href) ? "active" : ""}
                    onClick={
                      item.dropdown
                        ? (e) => handleDropdownClick(e, item.label)
                        : undefined
                    }
                  >
                    {item.label}
                    {item.dropdown && (
                      <svg className="icon icon-xs"><use href="#i-chev-down" /></svg>
                    )}
                  </a>
                  {item.dropdown && (
                    <ul className="dropdown">
                      {item.dropdown.map((sub) => (
                        <li key={sub.href}>
                          <a href={sub.href}>{sub.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <label className="search-box">
              <svg className="icon"><use href="#i-search" /></svg>
              <input type="text" placeholder="جستجو در محصولات..." />
            </label>
            <button
              className="icon-btn mobile-search-toggle"
              id="mobileSearchToggle"
              aria-label="جستجو"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <svg className="icon"><use href="#i-search" /></svg>
            </button>
            <a href="/account" className="icon-btn" aria-label="حساب کاربری">
              <svg className="icon"><use href="#i-user" /></svg>
            </a>
            <a href="/cart" className="icon-btn" aria-label="سبد خرید">
              <svg className="icon"><use href="#i-cart" /></svg>
              <span className="cart-badge">0</span>
            </a>
            <button
              className={`nav-toggle${navOpen ? " open" : ""}`}
              id="navToggle"
              aria-label="باز کردن منو"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <div className={`mobile-search-bar${searchOpen ? " open" : ""}`} id="mobileSearchBar">
          <label className="search-box search-box-mobile">
            <svg className="icon"><use href="#i-search" /></svg>
            <input type="text" placeholder="جستجو در محصولات..." autoFocus={searchOpen} />
          </label>
        </div>
      </header>
    </>
  );
}
