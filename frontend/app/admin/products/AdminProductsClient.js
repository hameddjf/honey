"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import {
  PageHeader,
  FilterBar,
  SearchInput,
  EmptyState,
  Drawer,
  ConfirmDialog,
  Field,
  FieldRow,
  useToast,
} from "@/components/admin/ui";
import {
  listCategories,
  listAdminProducts,
  getAdminProduct,
  buildProductPayload,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  setPrimaryProductImage,
  updateProductImage,
  deleteProductImage,
} from "@/lib/api/adminProducts";
import { formatToman as formatTomanPrice, stableSlugForName, SIZE_UNIT_LABELS } from "@/lib/products";
import { COSMETIC_PRODUCTS } from "@/lib/productsCosmetic";
import { toFa } from "@/lib/adminStore";
import { ApiError } from "@/lib/api/client";

const EMPTY_FORM = {
  title: "",
  tagline: "",
  price: "",
  previousPrice: "",
  category: "",
  stock: 0,
  sizeValue: "",
  sizeUnit: "",
  featured: false,
  status: "active",
  desc: "",
};

function toRow(product, categoriesBySlug) {
  const stableSlug = stableSlugForName(product.name);
  const cosmetic = (stableSlug && COSMETIC_PRODUCTS[stableSlug]) || {};
  const images = [...(product.images || [])].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order
  );
  return {
    apiSlug: product.slug,
    title: product.name,
    tagline: product.short_description,
    price: formatTomanPrice(product.price),
    rawPrice: product.price,
    previousPrice: product.previous_price ? formatTomanPrice(product.previous_price) : "",
    rawPreviousPrice: product.previous_price,
    categorySlug: product.category,
    categoryName: categoriesBySlug[product.category] || product.category,
    stock: product.stock,
    sizeValue: product.size_value ?? "",
    sizeUnit: product.size_unit || "",
    featured: product.is_featured,
    status: product.is_active ? "active" : "draft",
    desc: product.description,
    images,
    // Real uploaded image wins; the cosmetic image is only a fallback for
    // the original 7 catalog products until a real one is uploaded.
    image: images[0]?.url || cosmetic.image || "",
    badge: cosmetic.badge || "",
  };
}

export default function AdminProductsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // [{ slug, name }]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Image management for the product currently being edited.
  const [images, setImages] = useState([]);
  const [imageBusy, setImageBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const cats = await listCategories();
      const categoriesBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.name]));
      setCategories(cats);
      const items = await listAdminProducts();
      setProducts(items.map((p) => toRow(p, categoriesBySlug)));
      if (!form.category && cats.length) {
        setForm((f) => (f.category ? f : { ...f, category: cats[0].slug }));
      }
    } catch (err) {
      setLoadError(err.message || "بارگذاری محصولات از سرور ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openNew();
      router.replace("/admin/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.title.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.categorySlug === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, search, category]);

  function openNew() {
    setEditingSlug(null);
    setFormError("");
    setForm({ ...EMPTY_FORM, category: categories[0]?.slug || "" });
    setImages([]);
    setDrawerOpen(true);
  }

  function openEdit(p) {
    setEditingSlug(p.apiSlug);
    setFormError("");
    setForm({
      title: p.title || "",
      tagline: p.tagline || "",
      price: p.price || "",
      previousPrice: p.previousPrice || "",
      category: p.categorySlug || categories[0]?.slug || "",
      stock: p.stock ?? 0,
      sizeValue: p.sizeValue ?? "",
      sizeUnit: p.sizeUnit || "",
      featured: !!p.featured,
      status: p.status || "active",
      desc: p.desc || "",
    });
    setImages(p.images || []);
    setDrawerOpen(true);
  }

  async function refreshImages(slug) {
    try {
      const fresh = await getAdminProduct(slug);
      const sorted = [...(fresh.images || [])].sort(
        (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order
      );
      setImages(sorted);
      return sorted;
    } catch {
      // Non-fatal — the drawer keeps showing the last known image list.
      return images;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !String(form.price).trim() || !form.category) return;
    if ((form.sizeValue && !form.sizeUnit) || (!form.sizeValue && form.sizeUnit)) {
      setFormError("برای تعیین اندازه/وزن/حجم، هم مقدار و هم واحد لازم است.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildProductPayload(form, form.category);
      if (editingSlug) {
        await updateProduct(editingSlug, payload);
      } else {
        await createProduct(payload);
      }
      await refresh();
      setDrawerOpen(false);
      showToast(editingSlug ? "محصول به‌روزرسانی شد" : "محصول جدید اضافه شد");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "ذخیره محصول ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteProduct(pendingDelete.apiSlug);
      await refresh();
      showToast("محصول حذف شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حذف محصول ناموفق بود.");
    } finally {
      setPendingDelete(null);
    }
  }

  async function handleImageFiles(fileList) {
    if (!editingSlug || !fileList || !fileList.length) return;
    setImageBusy(true);
    try {
      for (const file of Array.from(fileList)) {
        // Sequential (not Promise.all) so uploads land in the order the
        // user picked them — sort_order defaults to upload order.
        // eslint-disable-next-line no-await-in-loop
        await uploadProductImage(editingSlug, file);
      }
      await refreshImages(editingSlug);
      showToast("تصویر اضافه شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "آپلود تصویر ناموفق بود.", "error");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSetPrimary(imageId) {
    if (!editingSlug) return;
    setImageBusy(true);
    try {
      await setPrimaryProductImage(editingSlug, imageId);
      await refreshImages(editingSlug);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "تنظیم تصویر اصلی ناموفق بود.", "error");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleDeleteImage(imageId) {
    if (!editingSlug) return;
    setImageBusy(true);
    try {
      await deleteProductImage(editingSlug, imageId);
      await refreshImages(editingSlug);
      showToast("تصویر حذف شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حذف تصویر ناموفق بود.", "error");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleMoveImage(index, direction) {
    const target = index + direction;
    if (!editingSlug || target < 0 || target >= images.length) return;
    setImageBusy(true);
    try {
      const a = images[index];
      const b = images[target];
      // Swap sort_order between the two neighbors — the simplest reorder
      // primitive that maps directly onto the backend's sort_order field.
      await Promise.all([
        updateProductImage(editingSlug, a.id, { sort_order: b.sort_order }),
        updateProductImage(editingSlug, b.id, { sort_order: a.sort_order }),
      ]);
      await refreshImages(editingSlug);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "جابه‌جایی تصویر ناموفق بود.", "error");
    } finally {
      setImageBusy(false);
    }
  }

  return (
    <AdminLayout active="/admin/products">
      <PageHeader
        title="محصولات"
        desc="افزودن، ویرایش و حذف محصولات فروشگاه — متصل به سرور Django."
        actions={
          <button type="button" className="a-btn a-btn-gold" onClick={openNew} disabled={!categories.length}>
            <svg className="icon"><use href="#i-plus" /></svg>
            <span>محصول جدید</span>
          </button>
        }
      />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16, color: "#B5452F" }}>
          {loadError} — <button type="button" className="a-btn" onClick={refresh}>تلاش مجدد</button>
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="جست‌وجوی محصول…" />
        <select className="a-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">همه‌ی دسته‌ها</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <div className="a-card"><EmptyState icon="i-box" title="در حال بارگذاری…" desc="" /></div>
      ) : filtered.length === 0 ? (
        <div className="a-card">
          <EmptyState icon="i-box" title="محصولی پیدا نشد" desc="فیلترها را تغییر دهید یا محصول جدیدی اضافه کنید." />
        </div>
      ) : (
        <div className="a-product-grid">
          {filtered.map((p) => (
            <div className="a-product-card" key={p.apiSlug}>
              <div className="a-product-card-img">
                {p.image && <img src={p.image} alt={p.title} />}
                {p.featured && (
                  <span className="a-product-card-star">
                    <svg className="icon icon-sm"><use href="#i-star" /></svg>
                  </span>
                )}
              </div>
              <div className="a-product-card-body">
                <div className="a-flex-between">
                  <span className="a-badge a-badge-faint">{p.categoryName}</span>
                  <span className={`a-badge ${p.status === "active" ? "a-badge-green" : "a-badge-faint"}`}>
                    {p.status === "active" ? "فعال" : "پیش‌نویس"}
                  </span>
                </div>
                <div className="a-product-card-title">{p.title}</div>
                <div className="a-product-card-meta">
                  <span>موجودی: {toFa(p.stock ?? 0)}</span>
                  <span>{p.sizeValue ? `${toFa(p.sizeValue)} ${SIZE_UNIT_LABELS[p.sizeUnit] || p.sizeUnit}` : ""}</span>
                </div>
                <div className="a-product-card-price">
                  {p.price} تومان
                  {p.previousPrice && (
                    <span style={{ marginInlineStart: 8, textDecoration: "line-through", opacity: 0.6, fontSize: 12 }}>
                      {p.previousPrice}
                    </span>
                  )}
                </div>
                <div className="a-product-card-actions">
                  <button type="button" className="a-btn" onClick={() => openEdit(p)}>
                    <svg className="icon"><use href="#i-edit" /></svg>
                    ویرایش
                  </button>
                  <button type="button" className="a-btn a-btn-danger" onClick={() => setPendingDelete(p)}>
                    <svg className="icon"><use href="#i-trash" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingSlug ? "ویرایش محصول" : "افزودن محصول جدید"}
        footer={
          <>
            <button type="button" className="a-btn a-btn-ghost" onClick={() => setDrawerOpen(false)}>انصراف</button>
            <button type="submit" form="product-form" className="a-btn a-btn-gold" disabled={saving}>
              {saving ? "در حال ذخیره..." : editingSlug ? "ذخیره تغییرات" : "افزودن محصول"}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit}>
          {formError && <p style={{ color: "#B5452F", fontSize: 13, marginBottom: 14 }}>{formError}</p>}
          <FieldRow>
            <Field label="عنوان محصول *">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </Field>
            <Field label="شعار کوتاه">
              <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="قیمت (تومان) *">
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="450000" required />
            </Field>
            <Field label="قیمت قبلی (تومان)">
              <input
                value={form.previousPrice}
                onChange={(e) => setForm((f) => ({ ...f, previousPrice: e.target.value }))}
                placeholder="اختیاری — برای نمایش تخفیف"
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="دسته‌بندی">
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="تعداد موجودی">
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="اندازه / وزن / حجم">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sizeValue}
                onChange={(e) => setForm((f) => ({ ...f, sizeValue: e.target.value }))}
                placeholder="مثلاً 450"
              />
            </Field>
            <Field label="واحد اندازه">
              <select value={form.sizeUnit} onChange={(e) => setForm((f) => ({ ...f, sizeUnit: e.target.value }))}>
                <option value="">—</option>
                {Object.entries(SIZE_UNIT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="وضعیت">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">فعال</option>
                <option value="draft">پیش‌نویس (غیرفعال)</option>
              </select>
            </Field>
            <Field>
              <label className="a-checkbox-row" style={{ marginTop: 28 }}>
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                نمایش به‌عنوان محصول ویژه در صفحه‌ی اصلی
              </label>
            </Field>
          </FieldRow>
          <Field label="توضیحات">
            <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          </Field>

          <Field label="تصاویر محصول">
            {!editingSlug ? (
              <p className="hint">برای افزودن تصویر، ابتدا محصول را ذخیره کنید — تصویر به محصول ذخیره‌شده متصل می‌شود.</p>
            ) : (
              <>
                <label
                  className="a-btn"
                  style={{ display: "inline-flex", cursor: imageBusy ? "not-allowed" : "pointer", opacity: imageBusy ? 0.6 : 1 }}
                >
                  <svg className="icon"><use href="#i-upload" /></svg>
                  <span>{imageBusy ? "در حال پردازش…" : "افزودن تصویر"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={imageBusy}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      handleImageFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                {images.length === 0 ? (
                  <p className="hint" style={{ marginTop: 10 }}>هنوز تصویری برای این محصول آپلود نشده.</p>
                ) : (
                  <div className="a-image-manager-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginTop: 12 }}>
                    {images.map((img, index) => (
                      <div
                        key={img.id}
                        style={{
                          position: "relative",
                          border: img.is_primary ? "2px solid var(--a-gold, #C99A3E)" : "1px solid var(--a-border, #E4DCC8)",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <img src={img.url} alt={img.alt_text || ""} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                        {img.is_primary && (
                          <span className="a-badge a-badge-gold" style={{ position: "absolute", top: 4, insetInlineStart: 4, fontSize: 10 }}>
                            اصلی
                          </span>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 2, padding: 4 }}>
                          <button
                            type="button"
                            className="a-btn"
                            style={{ padding: "2px 6px", fontSize: 11 }}
                            disabled={imageBusy || index === 0}
                            onClick={() => handleMoveImage(index, -1)}
                            title="جابه‌جایی به راست"
                          >
                            ‹
                          </button>
                          {!img.is_primary && (
                            <button
                              type="button"
                              className="a-btn"
                              style={{ padding: "2px 6px", fontSize: 11 }}
                              disabled={imageBusy}
                              onClick={() => handleSetPrimary(img.id)}
                              title="انتخاب به‌عنوان تصویر اصلی"
                            >
                              <svg className="icon icon-sm"><use href="#i-star" /></svg>
                            </button>
                          )}
                          <button
                            type="button"
                            className="a-btn a-btn-danger"
                            style={{ padding: "2px 6px", fontSize: 11 }}
                            disabled={imageBusy}
                            onClick={() => handleDeleteImage(img.id)}
                            title="حذف تصویر"
                          >
                            <svg className="icon icon-sm"><use href="#i-trash" /></svg>
                          </button>
                          <button
                            type="button"
                            className="a-btn"
                            style={{ padding: "2px 6px", fontSize: 11 }}
                            disabled={imageBusy || index === images.length - 1}
                            onClick={() => handleMoveImage(index, 1)}
                            title="جابه‌جایی به چپ"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="حذف محصول"
        desc={pendingDelete ? `محصول «${pendingDelete.title}» برای همیشه از سرور حذف شود؟` : ""}
        confirmLabel="حذف محصول"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
