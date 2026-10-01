"use client";

import { useEffect, useRef } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";

export default function ReturnsClient() {
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
            title: "شرایط بازگشت کالا",
            desc: "راهنمای مرجوعی و تعویض سفارش‌های عسل طبیعی نیکا",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/returns", label: "شرایط بازگشت کالا" },
            ],
          }),
        }}
      />

      <div className="container info-page">
        <div className="info-notice">
          <svg className="icon"><use href="#i-alert-triangle" /></svg>
          <p>
            متن این صفحه یک نمونه‌ی عمومی و غیرقطعی است و جای‌گزین شرایط رسمی و قانونی فروشگاه نمی‌شود. پیش از انتشار
            نهایی، لازم است توسط فروشگاه بازبینی و بر اساس قوانین حمایت از مصرف‌کننده تکمیل شود.
          </p>
        </div>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-shield" /></svg>در چه شرایطی می‌توانم کالا را برگردانم؟</h2>
          <ul className="info-list">
            <li>
              <svg className="icon"><use href="#i-check-circle" /></svg>
              بسته‌بندی محصول در حین حمل آسیب دیده یا نشتی داشته باشد.
            </li>
            <li>
              <svg className="icon"><use href="#i-check-circle" /></svg>
              محصول ارسال‌شده با سفارش ثبت‌شده مطابقت نداشته باشد (کالای اشتباه).
            </li>
            <li>
              <svg className="icon"><use href="#i-check-circle" /></svg>
              مهر و موم یا درب بسته باز نشده باشد (به دلایل بهداشتی، محصولات خوراکی باز/استفاده‌شده قابل بازگشت نیستند).
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-clock" /></svg>مهلت درخواست</h2>
          <p>
            درخواست بازگشت یا تعویض باید حداکثر تا <b>۷۲ ساعت</b> پس از دریافت مرسوله ثبت شود. برای ثبت درخواست بعد از
            این بازه، لازم است با پشتیبانی هماهنگ کنید تا بررسی شود.
          </p>
        </section>

        <section className="info-section">
          <h2><svg className="icon"><use href="#i-truck" /></svg>مراحل بازگشت کالا</h2>
          <div className="info-steps">
            <div className="info-step">
              <span className="info-step-num">۱</span>
              <div className="info-step-body">
                <h3>تماس با پشتیبانی</h3>
                <p>از طریق صفحه‌ی «تماس با ما» یا شماره درج‌شده در فوتر سایت، درخواست خود را همراه با شماره سفارش ثبت کنید.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="info-step-num">۲</span>
              <div className="info-step-body">
                <h3>بررسی درخواست</h3>
                <p>تیم پشتیبانی مورد را بررسی و در صورت تأیید، روش بازگشت (تعویض یا بازپرداخت) را به شما اطلاع می‌دهد.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="info-step-num">۳</span>
              <div className="info-step-body">
                <h3>ارسال یا بازپرداخت</h3>
                <p>پس از تأیید نهایی، کالای جدید ارسال یا مبلغ به همان روش پرداخت اولیه بازگردانده می‌شود.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="info-cta">
          <a className="btn btn-gold" href="/contact">تماس با پشتیبانی</a>
          <a className="btn btn-outline" href="/account">پیگیری سفارش</a>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
