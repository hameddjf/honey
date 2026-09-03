"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent";
import { fetchAdminContent, saveContentSection } from "@/lib/adminContentClient";

export default function AdminContentClient() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [toast, setToast] = useState("");

  const refresh = async () => {
    const result = await fetchAdminContent();
    if (result.ok) setContent(result.content);
  };

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const set = (section, field, value) =>
    setContent((c) => ({ ...c, [section]: { ...c[section], [field]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    // هر بخش (hero/video/topbar/footer) جدا در دیتابیس ذخیره می‌شود
    const sections = ["hero", "video", "topbar", "footer"];
    for (const key of sections) {
      await saveContentSection(key, content[key]);
    }
    showToast("✅ محتوا ذخیره شد");
  };

  const handleReset = async () => {
    if (!window.confirm("محتوای این بخش به حالت پیش‌فرض برگردد؟")) return;
    const sections = ["hero", "video", "topbar", "footer"];
    for (const key of sections) {
      await saveContentSection(key, DEFAULT_SITE_CONTENT[key]);
    }
    setContent(DEFAULT_SITE_CONTENT);
    showToast("↩️ به حالت پیش‌فرض برگشت");
  };

  return (
    <AdminLayout active="/nika-x7q2/content">
      <div className="admin-head">
        <div>
          <h1>محتوای سایت</h1>
          <p>ویرایش هیرو صفحه‌ی اصلی، ویدئوی معرفی و اطلاعات فوتر</p>
        </div>
        <button type="button" className="btn" style={{ border: "1px solid var(--border)", background: "var(--white)" }} onClick={handleReset}>
          <span>بازگشت به پیش‌فرض</span>
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* ---------- هیرو ---------- */}
        <div className="admin-card">
          <h3>
            <svg className="icon"><use href="#i-image" /></svg>
            پوستر اصلی (Hero)
          </h3>

          <div className="content-preview">
            <img className="bg" src={content.hero.image} alt="" />
            <div className="content-preview-inner">
              <p className="eyebrow">پیش‌نمایش زنده</p>
              <h2>{content.hero.title}</h2>
              <p className="desc">{content.hero.desc}</p>
            </div>
          </div>

          <div className="form-field" style={{ marginTop: 18 }}>
            <label>عنوان هیرو</label>
            <input value={content.hero.title} onChange={(e) => set("hero", "title", e.target.value)} />
          </div>
          <div className="form-field">
            <label>توضیح هیرو</label>
            <textarea value={content.hero.desc} onChange={(e) => set("hero", "desc", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>مسیر تصویر پس‌زمینه</label>
              <input dir="ltr" value={content.hero.image} onChange={(e) => set("hero", "image", e.target.value)} />
            </div>
            <div className="form-field">
              <label>متن دکمه</label>
              <input value={content.hero.ctaLabel} onChange={(e) => set("hero", "ctaLabel", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ---------- ویدئو ---------- */}
        <div className="admin-card">
          <h3>
            <svg className="icon"><use href="#i-play" /></svg>
            ویدئوی معرفی
          </h3>
          <div className="form-row">
            <div className="form-field">
              <label>عنوان دکمه‌ی پخش</label>
              <input value={content.video.label} onChange={(e) => set("video", "label", e.target.value)} />
            </div>
            <div className="form-field">
              <label>لینک ویدئو (YouTube / Aparat و ...)</label>
              <input dir="ltr" value={content.video.embedUrl} onChange={(e) => set("video", "embedUrl", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="form-field">
            <label>مسیر تصویر کاور ویدئو</label>
            <input dir="ltr" value={content.video.posterImage} onChange={(e) => set("video", "posterImage", e.target.value)} />
          </div>
        </div>

        {/* ---------- پیام بالای سایت ---------- */}
        <div className="admin-card">
          <h3>
            <svg className="icon"><use href="#i-truck" /></svg>
            پیام نوار بالای سایت
          </h3>
          <div className="form-field">
            <label>متن</label>
            <input value={content.topbar.message} onChange={(e) => set("topbar", "message", e.target.value)} />
          </div>
        </div>

        {/* ---------- فوتر ---------- */}
        <div className="admin-card">
          <h3>
            <svg className="icon"><use href="#i-pin" /></svg>
            اطلاعات فوتر و تماس
          </h3>
          <div className="form-field">
            <label>شعار زیر لوگو</label>
            <input value={content.footer.tagline} onChange={(e) => set("footer", "tagline", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>شماره تماس</label>
              <input dir="ltr" value={content.footer.phone} onChange={(e) => set("footer", "phone", e.target.value)} />
            </div>
            <div className="form-field">
              <label>ایمیل</label>
              <input dir="ltr" value={content.footer.email} onChange={(e) => set("footer", "email", e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label>آدرس</label>
            <input value={content.footer.address} onChange={(e) => set("footer", "address", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>لینک اینستاگرام</label>
              <input dir="ltr" value={content.footer.instagram} onChange={(e) => set("footer", "instagram", e.target.value)} />
            </div>
            <div className="form-field">
              <label>لینک تلگرام</label>
              <input dir="ltr" value={content.footer.telegram} onChange={(e) => set("footer", "telegram", e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
          <button type="submit" className="btn btn-gold">
            <span>ذخیره‌ی همه‌ی تغییرات</span>
          </button>
        </div>
      </form>

      {toast && <div className="admin-toast">{toast}</div>}
    </AdminLayout>
  );
}
