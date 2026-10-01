"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, DemoNote, ConfirmDialog, useToast } from "@/components/admin/ui";
import {
  getOrders,
  seedDemoOrders,
  clearDemoOrders,
  resetMedia,
  resetSettings,
  resetAllDemoData,
  toFa,
} from "@/lib/adminStore";
import { getEffectiveProducts, resetProductOverrides } from "@/lib/adminProducts";
import { resetSiteContent } from "@/lib/siteContent";

function Section({ icon, title, desc, children }) {
  return (
    <div className="a-card">
      <div className="a-card-head">
        <h3><svg className="icon"><use href={`#${icon}`} /></svg>{title}</h3>
      </div>
      {desc && <p className="a-card-head-desc" style={{ marginBottom: 14, lineHeight: 1.9 }}>{desc}</p>}
      {children}
    </div>
  );
}

export default function AdminMockDataClient() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const showToast = useToast();

  const refresh = () => {
    setOrders(getOrders());
    setProducts(getEffectiveProducts());
  };

  useEffect(() => {
    refresh();
  }, []);

  const demoOrderCount = orders.filter((o) => o.demo).length;
  const realOrderCount = orders.length - demoOrderCount;

  const runAction = (fn, message) => {
    fn();
    refresh();
    showToast(message);
  };

  return (
    <AdminLayout active="/admin/mockdata">
      <PageHeader
        title="داده‌های نمایشی"
        desc="مرکز کنترل داده‌های دموی پنل مدیریت — همه‌چیز فقط در همین مرورگر (localStorage) ذخیره می‌شود."
      />

      <DemoNote>
        این بخش فقط برای دورهٔ نمایش/فرانت‌اند است. با اتصال به بک‌اند واقعی، این کنترل‌ها باید با
        فراخوانی‌های سیدینگ سمت سرور (مثل <code dir="ltr">seed_demo</code> جنگو) جایگزین یا هماهنگ شوند.
      </DemoNote>

      <div className="a-grid-3">
        <Section
          icon="i-truck"
          title="سفارش‌ها و مشتریان"
          desc="سفارش‌های نمونه، پایهٔ داشبورد، گزارش‌ها و صفحهٔ مشتریان است."
        >
          <p style={{ fontSize: 12.5, color: "var(--a-text-soft)", marginBottom: 14 }}>
            {toFa(realOrderCount)} سفارش واقعیِ این مرورگر، {toFa(demoOrderCount)} سفارش نمونه.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button type="button" className="a-btn a-btn-gold a-btn-block" onClick={() => runAction(() => seedDemoOrders(18), "۱۸ سفارش نمونهٔ جدید اضافه شد")}>
              <svg className="icon"><use href="#i-database" /></svg>
              بارگذاری سفارش‌های نمونه
            </button>
            <button
              type="button"
              className="a-btn a-btn-block"
              disabled={demoOrderCount === 0}
              onClick={() => runAction(clearDemoOrders, "سفارش‌های نمونه حذف شدند")}
            >
              پاک‌کردن فقط سفارش‌های نمونه
            </button>
          </div>
        </Section>

        <Section icon="i-box" title="محصولات" desc="ویرایش‌های محلیِ محصولات (قیمت، موجودی، تصویر و…) را به حالت اولیه برگردانید.">
          <p style={{ fontSize: 12.5, color: "var(--a-text-soft)", marginBottom: 14 }}>
            {toFa(products.length)} محصول در کاتالوگ فعلی.
          </p>
          <button type="button" className="a-btn a-btn-block" onClick={() => runAction(resetProductOverrides, "محصولات به حالت پیش‌فرض بازگشتند")}>
            <svg className="icon"><use href="#i-refresh-cw" /></svg>
            بازگردانی محصولات
          </button>
        </Section>

        <Section icon="i-image" title="رسانه" desc="کتابخانه‌ی رسانه را به مجموعه‌ی اولیه (تصاویر محصولات + هیرو) بازگردانید.">
          <button type="button" className="a-btn a-btn-block" onClick={() => runAction(resetMedia, "کتابخانه‌ی رسانه بازنشانی شد")}>
            <svg className="icon"><use href="#i-refresh-cw" /></svg>
            بازنشانی رسانه
          </button>
        </Section>

        <Section icon="i-edit" title="محتوای سایت" desc="هیرو، ویدئو، پیام بالای سایت و فوتر را به مقادیر پیش‌فرض برگردانید.">
          <button type="button" className="a-btn a-btn-block" onClick={() => runAction(resetSiteContent, "محتوای سایت بازنشانی شد")}>
            <svg className="icon"><use href="#i-refresh-cw" /></svg>
            بازنشانی محتوا
          </button>
        </Section>

        <Section icon="i-sliders" title="تنظیمات فروشگاه" desc="تنظیمات ارسال، فروشگاه و اعلان‌ها را به مقدار اولیه برگردانید.">
          <button type="button" className="a-btn a-btn-block" onClick={() => runAction(resetSettings, "تنظیمات بازنشانی شد")}>
            <svg className="icon"><use href="#i-refresh-cw" /></svg>
            بازنشانی تنظیمات
          </button>
        </Section>

        <Section icon="i-alert-triangle" title="بازنشانی کامل" desc="همه‌ی داده‌های دمو (سفارش، رسانه، تنظیمات، محتوا و محصولات) را یک‌جا پاک می‌کند.">
          <button type="button" className="a-btn a-btn-danger a-btn-block" onClick={() => setConfirmAction("all")}>
            <svg className="icon"><use href="#i-trash" /></svg>
            بازنشانی همه‌ی داده‌های دمو
          </button>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmAction === "all"}
        title="بازنشانی کامل داده‌های دمو"
        desc="همه‌ی سفارش‌ها، رسانه، تنظیمات، محتوای سایت و ویرایش‌های محصولات در این مرورگر پاک می‌شوند. این عملیات قابل بازگشت نیست."
        confirmLabel="بله، همه چیز پاک شود"
        danger
        onConfirm={() => {
          resetAllDemoData();
          refresh();
          setConfirmAction(null);
          showToast("همه‌ی داده‌های دمو بازنشانی شدند");
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </AdminLayout>
  );
}
