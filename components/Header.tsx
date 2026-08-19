"use client";

import { useEffect, useState } from "react";
import { IconHome, IconHoneyJar, IconCart, IconStar, IconClose } from "./Icons";

const navLinks = [
  { href: "/#intro", label: "درباره عسل" },
  { href: "/shop", label: "محصولات" },
  { href: "/#process", label: "فرآیند تولید" },
  { href: "/#reviews", label: "نظرات مشتریان" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <nav className="site-nav">
            <div className="logo">
              <svg viewBox="0 0 100 100" className="logo-icon">
                <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill="var(--gold)" />
              </svg>
              عسل‌ستان
            </div>

            <ul className="nav-links">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>

            <div className="nav-actions">
              <a href="/shop" className="nav-cta">
                مشاهده فروشگاه
              </a>
              <a href="/cart" className="nav-cart-btn" aria-label="سبد خرید">
                <IconCart className="icon-20" />
              </a>
              <button
                className={`nav-burger ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              >
                <svg viewBox="0 0 44 44" className="burger-hex">
                  <polygon
                    className="burger-hex-shape"
                    points="22,4 38,13 38,31 22,40 6,31 6,13"
                  />
                  <line className="burger-line line-1" x1="14" y1="18" x2="30" y2="18" />
                  <line className="burger-line line-2" x1="14" y1="26" x2="30" y2="26" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile / collapsed drawer */}
      <div className={`mobile-drawer-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawer-blob drawer-blob-1" />
        <div className="drawer-blob drawer-blob-2" />
        <div className="drawer-hex-pattern" />

        <div className="mobile-drawer-head">
          <div className="logo">
            <svg viewBox="0 0 100 100" className="logo-icon">
              <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill="var(--gold)" />
            </svg>
            عسل‌ستان
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="بستن منو" className="drawer-close">
            <IconClose className="icon-16" />
          </button>
        </div>
        <ul className="mobile-drawer-links">
          {navLinks.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: menuOpen ? `${80 + i * 55}ms` : "0ms" }}>
              <a href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="/shop" className="btn-primary mobile-drawer-cta" onClick={() => setMenuOpen(false)}>
          مشاهده فروشگاه
        </a>
      </aside>

      {/* Mobile bottom nav — thumb-friendly */}
      <nav className="mobile-bottom-nav mobile-only">
        <a href="/" className="bn-item">
          <IconHome className="icon-20" />خانه
        </a>
        <a href="/shop" className="bn-item">
          <IconHoneyJar className="icon-20" />فروشگاه
        </a>
        <a href="/cart" className="bn-item">
          <IconCart className="icon-20" />سبد
        </a>
        <a href="/#reviews" className="bn-item">
          <IconStar className="icon-20" />نظرات
        </a>
      </nav>
    </>
  );
}
