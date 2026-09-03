"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  fetchAdminProducts,
  saveAdminProduct,
  deleteAdminProduct,
  slugify,
} from "@/lib/adminProductsClient";

const EMPTY_FORM = {
  slug: "",
  title: "",
  tagline: "",
  emoji: "🍯",
  price: "",
  weight: "",
  badge: "",
  origin: "",
  harvest: "",
  purity: "۱۰۰٪ خالص و تصفیه‌نشده",
  image: "",
  desc: "",
};

export default function AdminProductsClient() {
  const [products, setProducts] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null); // null = آیتم جدید
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState("");

  const refresh = async () => {
    const result = await fetchAdminProducts();
    if (result.ok) setProducts(result.products);
  };

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const openNew = () => {
    setEditingSlug(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingSlug(p.slug);
    setForm({
      slug: p.slug,
      title: p.title || "",
      tagline: p.tagline || "",
      emoji: p.emoji || "🍯",
      price: p.price || "",
      weight: p.weight || "",
      badge: p.badge || "",
      origin: p.origin || "",
      harvest: p.harvest || "",
      purity: p.purity || "",
      image: p.image || "",
      desc: p.desc || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price.trim()) return;

    const slug = editingSlug || slugify(form.title);
    const { slug: _drop, ...data } = form;
    const result = await saveAdminProduct(slug, data);
    if (!result.ok) {
      showToast("❌ " + (result.error || "ذخیره ناموفق بود"));
      return;
    }
    await refresh();
    setFormOpen(false);
    showToast(editingSlug ? "✅ محصول به‌روزرسانی شد" : "✅ محصول جدید اضافه شد");
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`محصول «${p.title}» حذف شود؟`)) return;
    await deleteAdminProduct(p.slug);
    await refresh();
    showToast("🗑️ محصول حذف شد");
  };

  return (
    <AdminLayout active="/nika-x7q2/products">
      <div className="admin-head">
        <div>
          <h1>محصولات</h1>
          <p>افزودن، ویرایش و حذف محصولات فروشگاه</p>
        </div>
        <button type="button" className="btn btn-gold" onClick={openNew}>
          <svg className="icon icon-sm"><use href="#i-plus" /></svg>
          <span>محصول جدید</span>
        </button>
      </div>

      {formOpen && (
        <div className="admin-card">
          <h3>
            <svg className="icon"><use href="#i-box" /></svg>
            {editingSlug ? "ویرایش محصول" : "محصول جدید"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-field">
                <label>عنوان محصول *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثلاً عسل چهل‌گیاه"
                  required
                />
              </div>
              <div className="form-field">
                <label>شعار کوتاه</label>
                <input
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="مثلاً خوش‌طعم و انرژی‌زا"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>قیمت (تومان) *</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="۲۴۰,۰۰۰"
                  required
                />
              </div>
              <div className="form-field">
                <label>وزن</label>
                <input
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="۴۵۰ گرم"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>برچسب (اختیاری)</label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="پرفروش"
                />
              </div>
              <div className="form-field">
                <label>ایموجی نماد</label>
                <input
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="🍯"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>منشأ</label>
                <input
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  placeholder="مراتع البرز"
                />
              </div>
              <div className="form-field">
                <label>فصل برداشت</label>
                <input
                  value={form.harvest}
                  onChange={(e) => setForm((f) => ({ ...f, harvest: e.target.value }))}
                  placeholder="تابستان"
                />
              </div>
            </div>
            <div className="form-field">
              <label>مسیر تصویر</label>
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="/images/products/example.jpg"
                dir="ltr"
              />
            </div>
            <div className="form-field">
              <label>توضیحات</label>
              <textarea
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                placeholder="توضیح کامل محصول..."
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <button type="submit" className="btn btn-gold">
                <span>{editingSlug ? "ذخیره تغییرات" : "افزودن محصول"}</span>
              </button>
              <button
                type="button"
                className="btn"
                style={{ border: "1px solid var(--border)", background: "var(--white)" }}
                onClick={() => setFormOpen(false)}
              >
                <span>انصراف</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <h3>
          <svg className="icon"><use href="#i-grid" /></svg>
          فهرست محصولات ({products.length.toLocaleString("fa-IR")})
        </h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>تصویر</th>
                <th>عنوان</th>
                <th>قیمت</th>
                <th>وزن</th>
                <th>برچسب</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.slug}>
                  <td>{p.image && <img className="thumb" src={p.image} alt={p.title} />}</td>
                  <td>
                    <b>{p.title}</b>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{p.slug}</div>
                  </td>
                  <td>{p.price} تومان</td>
                  <td>{p.weight}</td>
                  <td>{p.badge || "—"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" aria-label="ویرایش" onClick={() => openEdit(p)}>
                        <svg className="icon icon-sm"><use href="#i-edit" /></svg>
                      </button>
                      <button type="button" className="danger" aria-label="حذف" onClick={() => handleDelete(p)}>
                        <svg className="icon icon-sm"><use href="#i-trash" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </AdminLayout>
  );
}
