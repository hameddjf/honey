"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { commonScript } from "./_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "./_shared/SiteChrome";

export default function NotFound() {
  const scriptRanRef = useRef(false);

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
          <svg className="icon"><use href="#i-search" /></svg>
        </span>
        <p className="error-page-code">خطای ۴۰۴</p>
        <h1>این کندو خالی است!</h1>
        <p>
          صفحه‌ای که به دنبال آن بودید پیدا نشد؛ ممکن است آدرس اشتباه باشد یا این صفحه به مکان دیگری منتقل شده باشد.
        </p>
        <div className="error-page-actions">
          <Link className="btn btn-gold" href="/">بازگشت به صفحه اصلی</Link>
          <a className="btn btn-outline" href="/shop">مشاهده فروشگاه</a>
          <a className="btn btn-outline" href="/contact">تماس با پشتیبانی</a>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
