"use client";

import { useEffect, useRef } from "react";
import { commonScript, pageHero } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";

// The bare /invoice route (no order number) is just a landing/help screen
// now — there is no "last order" to fall back to in localStorage anymore.
// A real invoice always lives at /invoice/<order_number>, reached from
// checkout on success or from "جزئیات و فاکتور" in the account order list.
export default function InvoiceClient() {
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
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "فاکتور سفارش",
            desc: "رسید و جزئیات سفارش شما",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/account", label: "حساب کاربری" },
              { href: "/invoice", label: "فاکتور" },
            ],
          }),
        }}
      />

      <div className="cart-empty">
        <svg className="icon"><use href="#i-map-doc" /></svg>
        <h2>هیچ فاکتوری برای نمایش انتخاب نشده</h2>
        <p>برای مشاهده‌ی فاکتور یک سفارش، از تاریخچه‌ی سفارش‌های خود در حساب کاربری وارد شوید، یا لینک فاکتوری را که پس از ثبت سفارش دریافت کرده‌اید باز کنید.</p>
        <a href="/account?tab=orders" className="btn btn-gold">
          <span>مشاهده سفارش‌های من</span>
        </a>
      </div>

      <PublicFooter />
    </>
  );
}
