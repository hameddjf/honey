"use client";

import { useEffect, useRef } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";

export default function BuyingGuideClient() {
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
            title: "راهنمای خرید",
            desc: "چطور محصول مناسب خودتان را از میان محصولات نیکا انتخاب و سفارش دهید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/buying-guide", label: "راهنمای خرید" },
            ],
          }),
        }}
      />

      <div className="container info-page">
        <section className="info-section">
          <h2><svg className="icon"><use href="#i-search" /></svg>۱. انتخاب دسته‌بندی مناسب</h2>
          <p>
            محصولات نیکا در دو دسته ارائه می‌شوند: <b>عسل‌ها</b> (انواع عسل خالص و طبیعی با طعم‌های متفاوت) و{" "}
            <b>ژل رویال و ترکیبات ویژه</b> (ترکیبات تقویتی فراتر از عسل معمولی، مانند ژل رویال). اگر هدف شما تقویت
            بیشتر بدن یا دوران نقاهت است، دسته‌ی دوم را در <a href="/shop">فروشگاه</a> ببینید؛ برای مصرف روزمره، انواع
            عسل‌ها گزینه‌ی مناسب‌تری هستند.
          </p>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-box" /></svg>۲. مراحل خرید</h2>
          <div className="info-steps">
            <div className="info-step">
              <span className="info-step-num">۱</span>
              <div className="info-step-body">
                <h3>مرور و انتخاب محصول</h3>
                <p>در <a href="/shop">فروشگاه</a> محصول مورد نظر را پیدا کنید و برای مشاهده‌ی توضیحات کامل، روی آن کلیک کنید.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="info-step-num">۲</span>
              <div className="info-step-body">
                <h3>افزودن به سبد خرید</h3>
                <p>تعداد مورد نظر را انتخاب و به سبد خرید اضافه کنید؛ می‌توانید همزمان چند محصول مختلف سفارش دهید.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="info-step-num">۳</span>
              <div className="info-step-body">
                <h3>تکمیل اطلاعات ارسال</h3>
                <p>در مرحله‌ی «تسویه حساب»، آدرس و اطلاعات تماس خود را وارد کنید.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="info-step-num">۴</span>
              <div className="info-step-body">
                <h3>پرداخت و پیگیری</h3>
                <p>پس از پرداخت، می‌توانید وضعیت سفارش را از بخش «حساب کاربری» پیگیری کنید.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-medal" /></svg>۳. چند نکته برای انتخاب بهتر</h2>
          <ul className="info-list">
            <li><svg className="icon"><use href="#i-leaf" /></svg>برچسب «پرفروش» یا «پیشنهاد ویژه» روی محصولات، انتخاب‌های محبوب مشتریان دیگر را نشان می‌دهد.</li>
            <li><svg className="icon"><use href="#i-drop" /></svg>بلوره‌شدن برخی عسل‌ها (مثل عسل کلزا) طبیعی است و نشانه‌ی خلوص محصول است، نه افت کیفیت.</li>
            <li><svg className="icon"><use href="#i-shield" /></svg>برای اطلاعات بیشتر درباره‌ی ارسال و بازگشت کالا، صفحات «روش‌های ارسال» و «شرایط بازگشت کالا» را ببینید.</li>
          </ul>
        </section>

        <div className="info-cta">
          <a className="btn btn-gold" href="/shop">مشاهده فروشگاه</a>
          <a className="btn btn-outline" href="/faq">سوالات متداول</a>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
