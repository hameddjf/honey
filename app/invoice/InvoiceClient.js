"use client";

import { useEffect, useRef, useState } from "react";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../_shared/chrome";

const ORDER_KEY = "nika_last_order";
const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

const PAYMENT_LABEL = {
  online: "پرداخت آنلاین (دمو)",
  cod: "پرداخت در محل",
};

export default function InvoiceClient() {
  const scriptRanRef = useRef(false);
  const [order, setOrder] = useState(null); // null = loading, false = not found
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      setOrder(raw ? JSON.parse(raw) : false);
    } catch {
      setOrder(false);
    }
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

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE + TOPBAR + HEADER }} />
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

      {!mounted || order === null ? null : !order ? (
        <div className="cart-empty">
          <svg className="icon"><use href="#i-map-doc" /></svg>
          <h2>هنوز فاکتوری برای نمایش وجود ندارد</h2>
          <p>پس از تکمیل فرآیند خرید، فاکتور سفارش شما همین‌جا نمایش داده می‌شود.</p>
          <a href="/shop" className="btn btn-gold">
            <span>مشاهده فروشگاه</span>
          </a>
        </div>
      ) : (
        <div className="invoice-wrap">
          <div className="invoice-success">
            <svg className="icon"><use href="#i-check-circle" /></svg>
            <h1>سفارش شما با موفقیت ثبت شد</h1>
            <p>یک نسخه از این فاکتور برای پیگیری سفارش نزد خود نگه دارید.</p>
          </div>

          <div className="invoice-card" id="invoiceCard">
            <div className="invoice-head">
              <div className="logo">
                <span className="logo-mark">
                  <svg className="icon"><use href="#i-hexframe" /></svg>
                  <svg className="icon logo-bee"><use href="#i-bee" /></svg>
                </span>
                <span className="logo-text">
                  عسل طبیعی<strong>نیکا</strong>
                </span>
              </div>
              <div className="invoice-num">
                <b>فاکتور شماره {order.id}</b>
                تاریخ: {order.date} — {order.time}
              </div>
            </div>

            <div className="invoice-parties">
              <div>
                <h5>گیرنده سفارش</h5>
                <p>
                  {order.customer.name}
                  <br />
                  {order.customer.phone}
                  <br />
                  {order.customer.city} — {order.customer.address}
                  {order.customer.postal ? ` (کدپستی: ${order.customer.postal})` : ""}
                </p>
              </div>
              <div>
                <h5>فروشنده</h5>
                <p>
                  عسل طبیعی نیکا
                  <br />
                  ایران، مازندران، ساری
                  <br />
                  روش پرداخت: {PAYMENT_LABEL[order.payment] || order.payment}
                </p>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th className="num">تعداد</th>
                  <th className="num">قیمت واحد</th>
                  <th className="num">جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.key}>
                    <td>
                      {it.title}
                      {it.weight ? ` (${it.weight})` : ""}
                    </td>
                    <td className="num">{toFa(it.qty)}</td>
                    <td className="num">{formatToman(it.price)}</td>
                    <td className="num">{formatToman(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="summary-row">
                <span>جمع کالاها</span>
                <span>{formatToman(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>هزینه ارسال</span>
                <span>{order.shipping === 0 ? "رایگان" : formatToman(order.shipping)}</span>
              </div>
              <div className="summary-row total">
                <span>مبلغ نهایی</span>
                <span>{formatToman(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-actions">
            <button type="button" className="btn btn-gold" onClick={() => window.print()}>
              <svg className="icon icon-sm"><use href="#i-printer" /></svg>
              <span>چاپ فاکتور</span>
            </button>
            <a href="/account?tab=orders" className="btn" style={{ border: "1px solid var(--border)", background: "var(--white)" }}>
              <span>مشاهده در حساب کاربری</span>
            </a>
            <a href="/shop" className="btn" style={{ border: "1px solid var(--border)", background: "var(--white)" }}>
              <span>ادامه خرید</span>
            </a>
          </div>
        </div>
      )}

      <div dangerouslySetInnerHTML={{ __html: FOOTER }} />
    </>
  );
}
