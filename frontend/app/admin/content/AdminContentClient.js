"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, Field, FieldRow, SwitchRow, DemoNote, LoadingState, useToast } from "@/components/admin/ui";
import { fetchSiteContent, saveSiteContentRemote, resetSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";
import { ApiError } from "@/lib/api/client";

export default function AdminContentClient() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchSiteContent().then((c) => {
      if (!cancelled) setContent(c);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (section, field, value) =>
    setContent((c) => ({ ...c, [section]: { ...c[section], [field]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteContentRemote(content);
      showToast("محتوا ذخیره شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "ذخیره‌سازی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("محتوای این بخش به حالت پیش‌فرض برگردد؟")) return;
    resetSiteContent();
    setContent(DEFAULT_SITE_CONTENT);
    showToast("به حالت پیش‌فرض برگشت (فقط محلی — برای اعمال روی سرور دوباره ذخیره کنید)");
  };

  return (
    <AdminLayout active="/admin/content">
      <PageHeader
        title="محتوای سایت"
        desc="ویرایش هیرو، ویدئوی معرفی، بنر تبلیغاتی، تماس، شبکه‌های اجتماعی و فوتر."
        actions={
          <button type="button" className="a-btn a-btn-ghost" onClick={handleReset}>
            <svg className="icon"><use href="#i-refresh-cw" /></svg>
            بازگشت به پیش‌فرض
          </button>
        }
      />

      <DemoNote>
        هیرو، تاپ‌بار، تماس، شبکه‌های اجتماعی، فوتر و بنر روی بک‌اند جنگو ذخیره می‌شوند. ویدئوی معرفی و متن/لینک
        دکمه‌ها هنوز فقط محلی‌اند (بک‌اند مدل ندارد). چون صفحه‌ی اصلی سایت هنوز استاتیک است، تغییرات فعلاً فقط در
        پیش‌نمایش همین پنل دیده می‌شوند.
      </DemoNote>

      {loading ? (
        <div className="a-card"><LoadingState label="در حال بارگذاری محتوا…" /></div>
      ) : (
      <form onSubmit={handleSave}>
        {/* ---------- هیرو ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-image" /></svg>پوستر اصلی (Hero)</h3></div>

          <div className="content-preview">
            <img className="bg" src={content.hero.image} alt="" />
            <div className="content-preview-inner">
              <p className="eyebrow">پیش‌نمایش زنده</p>
              <h2>{content.hero.title}</h2>
              <p className="desc">{content.hero.desc}</p>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Field label="عنوان هیرو">
              <input value={content.hero.title} onChange={(e) => set("hero", "title", e.target.value)} />
            </Field>
            <Field label="توضیح هیرو">
              <textarea value={content.hero.desc} onChange={(e) => set("hero", "desc", e.target.value)} />
            </Field>
            <FieldRow>
              <Field label="مسیر تصویر پس‌زمینه">
                <input dir="ltr" value={content.hero.image} onChange={(e) => set("hero", "image", e.target.value)} />
              </Field>
              <Field label="متن دکمه">
                <input value={content.hero.ctaLabel} onChange={(e) => set("hero", "ctaLabel", e.target.value)} />
              </Field>
            </FieldRow>
          </div>
        </div>

        {/* ---------- ویدئو ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-play" /></svg>ویدئوی معرفی</h3></div>
          <FieldRow>
            <Field label="عنوان دکمه‌ی پخش">
              <input value={content.video.label} onChange={(e) => set("video", "label", e.target.value)} />
            </Field>
            <Field label="لینک ویدئو (YouTube / Aparat و ...)">
              <input dir="ltr" value={content.video.embedUrl} onChange={(e) => set("video", "embedUrl", e.target.value)} placeholder="https://..." />
            </Field>
          </FieldRow>
          <Field label="مسیر تصویر کاور ویدئو">
            <input dir="ltr" value={content.video.posterImage} onChange={(e) => set("video", "posterImage", e.target.value)} />
          </Field>
        </div>

        {/* ---------- بنر تبلیغاتی ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-truck" /></svg>پیام نوار بالای سایت و بنر تبلیغاتی</h3></div>
          <Field label="متن نوار بالای سایت">
            <input value={content.topbar.message} onChange={(e) => set("topbar", "message", e.target.value)} />
          </Field>
          <SwitchRow
            label="نمایش بنر تبلیغاتی"
            desc="یک بنر تشویقی اضافه (مثلاً برای تخفیف فصلی) روی سایت نمایش داده شود."
            checked={content.promo.enabled}
            onChange={(v) => set("promo", "enabled", v)}
          />
          <FieldRow>
            <Field label="متن بنر">
              <input value={content.promo.message} onChange={(e) => set("promo", "message", e.target.value)} />
            </Field>
            <Field label="متن دکمه">
              <input value={content.promo.ctaLabel} onChange={(e) => set("promo", "ctaLabel", e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="لینک دکمه">
            <input dir="ltr" value={content.promo.ctaHref} onChange={(e) => set("promo", "ctaHref", e.target.value)} placeholder="/shop" />
          </Field>
        </div>

        {/* ---------- اطلاعات تماس ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-phone" /></svg>اطلاعات تماس</h3></div>
          <FieldRow>
            <Field label="شماره تماس">
              <input dir="ltr" value={content.footer.phone} onChange={(e) => set("footer", "phone", e.target.value)} />
            </Field>
            <Field label="ایمیل">
              <input dir="ltr" value={content.footer.email} onChange={(e) => set("footer", "email", e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="آدرس">
            <input value={content.footer.address} onChange={(e) => set("footer", "address", e.target.value)} />
          </Field>
        </div>

        {/* ---------- شبکه‌های اجتماعی ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-instagram" /></svg>شبکه‌های اجتماعی</h3></div>
          <FieldRow>
            <Field label="لینک اینستاگرام">
              <input dir="ltr" value={content.footer.instagram} onChange={(e) => set("footer", "instagram", e.target.value)} />
            </Field>
            <Field label="لینک تلگرام">
              <input dir="ltr" value={content.footer.telegram} onChange={(e) => set("footer", "telegram", e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="لینک واتس‌اپ">
            <input dir="ltr" value={content.footer.whatsapp} onChange={(e) => set("footer", "whatsapp", e.target.value)} />
          </Field>
        </div>

        {/* ---------- فوتر ---------- */}
        <div className="a-card">
          <div className="a-card-head"><h3><svg className="icon"><use href="#i-pin" /></svg>فوتر</h3></div>
          <Field label="شعار زیر لوگو">
            <input value={content.footer.tagline} onChange={(e) => set("footer", "tagline", e.target.value)} />
          </Field>
        </div>

        <button type="submit" className="a-btn a-btn-gold" disabled={saving}>
          <svg className="icon"><use href="#i-check-circle" /></svg>
          {saving ? "در حال ذخیره…" : "ذخیره‌ی همه‌ی تغییرات"}
        </button>
      </form>
      )}
    </AdminLayout>
  );
}
