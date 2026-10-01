"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, Field, FieldRow, SwitchRow, LoadingState, useToast } from "@/components/admin/ui";
import { getSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/adminStore";
import { getStoreSettings, updateStoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/api/storeSettings";
import { ApiError } from "@/lib/api/client";

// "اطلاعات فروشگاه" (نام/مدیر/ایمیل/تلفن/آدرس) در همین مرورگر می‌ماند — این
// فیلدها همان‌هایی هستند که در /admin/content (SiteContent) واقعاً ویرایش
// و روی سرور ذخیره می‌شوند؛ تکرار یک مدل جدید در بک‌اند فقط برای این بخش
// چیزی اضافه نمی‌کرد (بخش ۶ بریف: «فیلد تنظیمات غیرضروری نسازید»). بخش‌های
// ارسال/تسویه‌حساب مهمان/آستانه‌ی موجودی/حالت تعمیر/اعلان‌ها — که بریف
// صراحتاً به‌عنوان حداقل لازم نام برده — از StoreSettings واقعی خوانده و
// در آن ذخیره می‌شوند.
export default function AdminSettingsClient() {
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    setLocalSettings(getSettings());
    getStoreSettings()
      .then(setStoreSettings)
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "بارگذاری تنظیمات از سرور ناموفق بود.");
        setStoreSettings(DEFAULT_STORE_SETTINGS);
      })
      .finally(() => setLoading(false));
  }, []);

  const setLocal = (section, field, value) =>
    setLocalSettings((s) => ({ ...s, [section]: { ...s[section], [field]: value } }));

  const setStore = (field, value) => setStoreSettings((s) => ({ ...s, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    saveSettings(localSettings);
    setSaving(true);
    try {
      const updated = await updateStoreSettings({
        shipping_enabled: !!storeSettings.shipping_enabled,
        shipping_flat_cost: Number(storeSettings.shipping_flat_cost) || 0,
        free_shipping_threshold:
          storeSettings.free_shipping_threshold === "" || storeSettings.free_shipping_threshold === null
            ? null
            : Number(storeSettings.free_shipping_threshold),
        guest_checkout_enabled: !!storeSettings.guest_checkout_enabled,
        maintenance_mode: !!storeSettings.maintenance_mode,
        low_stock_threshold: Number(storeSettings.low_stock_threshold) || 0,
        notify_new_order: !!storeSettings.notify_new_order,
        notify_low_stock: !!storeSettings.notify_low_stock,
      });
      setStoreSettings(updated);
      showToast("تنظیمات ذخیره شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "ذخیره‌ی تنظیمات ناموفق بود.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="/admin/settings">
        <PageHeader title="تنظیمات عمومی" desc="اطلاعات فروشگاه، ارسال و اعلان‌ها." />
        <div className="a-card"><LoadingState /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="/admin/settings">
      <PageHeader title="تنظیمات عمومی" desc="اطلاعات فروشگاه، ارسال و اعلان‌ها." />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16, color: "#B5452F" }}>{loadError}</div>
      )}

      <form onSubmit={handleSave}>
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-box" /></svg>اطلاعات فروشگاه</h3></div>
          <FieldRow>
            <Field label="نام فروشگاه">
              <input value={localSettings.store.name} onChange={(e) => setLocal("store", "name", e.target.value)} />
            </Field>
            <Field label="نام مدیر">
              <input value={localSettings.store.ownerName} onChange={(e) => setLocal("store", "ownerName", e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="ایمیل">
              <input dir="ltr" value={localSettings.store.email} onChange={(e) => setLocal("store", "email", e.target.value)} />
            </Field>
            <Field label="شماره تماس">
              <input dir="ltr" value={localSettings.store.phone} onChange={(e) => setLocal("store", "phone", e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="آدرس" hint="این فیلدها نمایشی‌اند — مقادیر واقعی که در سایت نمایش داده می‌شوند از «مدیریت محتوا» ویرایش می‌شوند.">
            <input value={localSettings.store.address} onChange={(e) => setLocal("store", "address", e.target.value)} />
          </Field>
        </div>

        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-truck" /></svg>تنظیمات ارسال</h3></div>
          <SwitchRow
            label="ارسال محاسبه شود"
            desc="در صورت خاموش بودن، هزینه‌ی ارسال همیشه صفر در نظر گرفته می‌شود."
            checked={storeSettings.shipping_enabled}
            onChange={(v) => setStore("shipping_enabled", v)}
          />
          <FieldRow>
            <Field label="هزینه‌ی پیش‌فرض ارسال (تومان)">
              <input
                type="number"
                value={storeSettings.shipping_flat_cost}
                onChange={(e) => setStore("shipping_flat_cost", e.target.value)}
              />
            </Field>
            <Field label="آستانه‌ی ارسال رایگان (تومان)" hint="خالی بگذارید تا ارسال رایگان غیرفعال شود.">
              <input
                type="number"
                value={storeSettings.free_shipping_threshold ?? ""}
                onChange={(e) => setStore("free_shipping_threshold", e.target.value === "" ? null : e.target.value)}
              />
            </Field>
          </FieldRow>
        </div>

        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-sliders" /></svg>تنظیمات عمومی</h3></div>
          <SwitchRow
            label="حالت تعمیر و نگهداری"
            desc="با فعال بودن، فروشگاه برای بازدیدکننده‌ها در دسترس نیست (این پرچم را فرانت‌اند در پیام مربوطه استفاده می‌کند)."
            checked={storeSettings.maintenance_mode}
            onChange={(v) => setStore("maintenance_mode", v)}
          />
          <SwitchRow
            label="امکان خرید بدون ثبت‌نام"
            desc="اجازه‌ی تکمیل خرید بدون ایجاد حساب کاربری"
            checked={storeSettings.guest_checkout_enabled}
            onChange={(v) => setStore("guest_checkout_enabled", v)}
          />
          <Field label="آستانه‌ی هشدار موجودی کم" hint="در این تعداد یا کمتر، محصول در داشبورد به‌عنوان «موجودی کم» علامت‌گذاری می‌شود.">
            <input
              type="number"
              value={storeSettings.low_stock_threshold}
              onChange={(e) => setStore("low_stock_threshold", e.target.value)}
            />
          </Field>
        </div>

        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-bell" /></svg>اعلان‌ها</h3></div>
          <SwitchRow
            label="اعلان سفارش جدید"
            desc="فعال/غیرفعال‌سازی اعلان برای هر سفارش جدید (بدون کانال ارسال متصل در این نسخه)"
            checked={storeSettings.notify_new_order}
            onChange={(v) => setStore("notify_new_order", v)}
          />
          <SwitchRow
            label="هشدار موجودی کم"
            checked={storeSettings.notify_low_stock}
            onChange={(v) => setStore("notify_low_stock", v)}
          />
        </div>

        <button type="submit" className="a-btn a-btn-gold" disabled={saving}>
          <svg className="icon"><use href="#i-check-circle" /></svg>
          {saving ? "در حال ذخیره…" : "ذخیره‌ی تنظیمات"}
        </button>
      </form>
    </AdminLayout>
  );
}
