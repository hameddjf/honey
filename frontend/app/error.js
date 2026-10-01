"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { commonScript } from "./_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "./_shared/SiteChrome";

export default function ErrorBoundary({ error, reset }) {
  const scriptRanRef = useRef(false);

  useEffect(() => {
    // فقط برای دیباگ در کنسول توسعه‌دهنده — هیچ جزئیات فنی/استک‌تریسی به
    // کاربر نمایش داده نمی‌شود.
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    return () => script.remove();
  }, []);

  return (
    <>
      <PublicTopbarHeader />

      <div className="container error-page">
        <span className="error-page-icon">
          <svg className="icon"><use href="#i-alert-triangle" /></svg>
        </span>
        <p className="error-page-code">خطای غیرمنتظره</p>
        <h1>یک مشکل کوچک پیش آمد</h1>
        <p>
          مشکلی در نمایش این صفحه رخ داد. این خطا ثبت شده و تلاش برای عسل‌های شما ادامه دارد؛ لطفاً دوباره تلاش کنید
          یا به صفحه اصلی برگردید.
        </p>
        <div className="error-page-actions">
          <button type="button" className="btn btn-gold" onClick={() => reset()}>دوباره تلاش کنید</button>
          <Link className="btn btn-outline" href="/">بازگشت به صفحه اصلی</Link>
          <a className="btn btn-outline" href="/contact">تماس با پشتیبانی</a>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
