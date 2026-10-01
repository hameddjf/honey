"use client";

import { useEffect, useRef, useState } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";
import { getSettings, formatToman, DEFAULT_SETTINGS } from "@/lib/adminStore";

export default function ShippingClient() {
  const scriptRanRef = useRef(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getSettings());
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

  const { shipping } = settings;

  return (
    <>
      <PublicTopbarHeader />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "روش‌های ارسال",
            desc: "سفارش شما چطور و در چه زمانی به دستتان می‌رسد",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/shipping", label: "روش‌های ارسال" },
            ],
          }),
        }}
      />

      <div className="container info-page">
        <div className="info-notice">
          <svg className="icon"><use href="#i-alert-triangle" /></svg>
          <p>
            این صفحه یک نمونه‌ی نمایشی است؛ زمان‌بندی و هزینه‌ها از تنظیمات فعلی فروشگاه (پنل مدیریت) خوانده می‌شود
            و پیش از انتشار نهایی باید توسط فروشگاه تأیید یا به‌روزرسانی شود.
          </p>
        </div>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-truck" /></svg>محدوده و زمان ارسال</h2>
          <p>
            سفارش‌های عسل طبیعی نیکا به <b>{shipping.zones}</b> ارسال می‌شود. پس از ثبت و تأیید سفارش، بسته‌بندی و
            آماده‌سازی معمولاً <b>{shipping.processingDays}</b> طول می‌کشد؛ زمان تحویل نهایی به شهر مقصد و شرکت پیک/پستی
            بستگی دارد و معمولاً بین ۲ تا ۵ روز کاری پس از ارسال است.
          </p>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-credit-card" /></svg>هزینه‌ی ارسال</h2>
          <ul className="info-list">
            <li>
              <svg className="icon"><use href="#i-check-circle" /></svg>
              برای سفارش‌های بالای <b>{formatToman(shipping.freeShippingThreshold)}</b> ارسال رایگان است.
            </li>
            <li>
              <svg className="icon"><use href="#i-check-circle" /></svg>
              برای سفارش‌های کمتر از این مقدار، هزینه‌ی ارسال به‌صورت پیش‌فرض <b>{formatToman(shipping.defaultShippingCost)}</b> محاسبه می‌شود (بسته به وزن و مقصد ممکن است متفاوت باشد).
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-box" /></svg>بسته‌بندی</h2>
          <p>
            محصولات در بسته‌بندی مناسب حمل عسل (ضدشکست و ایمن در برابر نشتی) ارسال می‌شوند تا کیفیت و بسته‌بندی اصلی
            محصول در طول مسیر حفظ شود.
          </p>
        </section>

        <div className="info-cta">
          <a className="btn btn-gold" href="/shop">مشاهده محصولات</a>
          <a className="btn btn-outline" href="/faq">سوالات متداول</a>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
