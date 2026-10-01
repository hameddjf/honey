"use client";

import { useEffect, useRef, useState } from "react";
import { pageHero, commonScript } from "../../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../../_shared/SiteChrome";
import { getOrderByNumber } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

const PAYMENT_METHOD_LABEL = {
  online: "پرداخت آنلاین",
  cod: "پرداخت در محل",
};

const PAYMENT_STATUS_LABEL = {
  unpaid: "پرداخت‌نشده",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  refunded: "بازگشت وجه",
};

// This is the source of truth: everything shown comes straight from the
// Django Order (see backend/orders/models.py + OrderSerializer). It
// survives a refresh or a different device because it's re-fetched by
// order_number every time this page loads — nothing here is read from
// localStorage.
export default function InvoiceDetailClient({ orderNumber }) {
  const scriptRanRef = useRef(false);
  const [state, setState] = useState({ status: "loading", order: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    getOrderByNumber(orderNumber)
      .then((order) => {
        if (cancelled) return;
        setState({ status: "ready", order, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setState({ status: "error", order: null, error: "این فاکتور متعلق به حساب دیگری است. لطفاً با حساب صاحب سفارش وارد شوید." });
        } else if (err instanceof ApiError && err.status === 404) {
          setState({ status: "error", order: null, error: "چنین سفارشی پیدا نشد." });
        } else {
          setState({ status: "error", order: null, error: "بارگذاری فاکتور ناموفق بود. اتصال خود را بررسی کنید." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    return () => script.remove();
  }, []);

  const order = state.order;
  const created = order ? new Date(order.created_at) : null;

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

      {state.status === "loading" ? (
        <div className="cart-empty">
          <p>در حال بارگذاری فاکتور...</p>
        </div>
      ) : state.status === "error" ? (
        <div className="cart-empty">
          <svg className="icon"><use href="#i-map-doc" /></svg>
          <h2>فاکتور در دسترس نیست</h2>
          <p>{state.error}</p>
          <a href="/account?tab=orders" className="btn btn-gold">
            <span>مشاهده سفارش‌های من</span>
          </a>
        </div>
      ) : (
        <div className="invoice-wrap">
          <div className="invoice-success">
            <svg className="icon"><use href="#i-check-circle" /></svg>
            <h1>فاکتور سفارش شما</h1>
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
                <b>فاکتور شماره {order.invoice_number}</b>
                شماره سفارش: {order.order_number}
                <br />
                تاریخ: {created.toLocaleDateString("fa-IR")} — {created.toLocaleTimeString("fa-IR")}
              </div>
            </div>

            <div className="invoice-parties">
              <div>
                <h5>گیرنده سفارش</h5>
                <p>
                  {order.customer_name || order.customer_email || "مشتری مهمان"}
                  <br />
                  {order.contact_phone}
                  <br />
                  {order.shipping_address}
                </p>
              </div>
              <div>
                <h5>فروشنده</h5>
                <p>
                  عسل طبیعی نیکا
                  <br />
                  ایران، مازندران، ساری
                  <br />
                  روش پرداخت: {PAYMENT_METHOD_LABEL[order.payment_method] || "—"}
                  <br />
                  وضعیت پرداخت: {PAYMENT_STATUS_LABEL[order.payment_status] || order.payment_status}
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
                  <tr key={it.id}>
                    <td>{it.product_name}</td>
                    <td className="num">{toFa(it.quantity)}</td>
                    <td className="num">{formatToman(parseFloat(it.unit_price))}</td>
                    <td className="num">{formatToman(parseFloat(it.line_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="summary-row">
                <span>جمع کالاها</span>
                <span>{formatToman(parseFloat(order.subtotal))}</span>
              </div>
              <div className="summary-row">
                <span>هزینه ارسال</span>
                <span>{parseFloat(order.shipping_cost) === 0 ? "رایگان" : formatToman(parseFloat(order.shipping_cost))}</span>
              </div>
              <div className="summary-row total">
                <span>مبلغ نهایی</span>
                <span>{formatToman(parseFloat(order.total))}</span>
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

      <PublicFooter />
    </>
  );
}
