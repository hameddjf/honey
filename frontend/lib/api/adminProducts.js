// لایه‌ی مدیریت محصولات برای پنل ادمین — نسخه‌ی متصل به Django.
//
// این فایل جای lib/adminProducts.js (localStorage-only) را برای عملیات
// CRUD واقعی می‌گیرد. تمام داده‌ی تجاری محصول — از جمله اندازه/واحد و
// تصاویر — اکنون در بک‌اند ذخیره و از همین‌جا مدیریت می‌شود. فیلدهای
// صرفاً بازاریابی (ایموجی/بج/منشأ/فصل برداشت) در بک‌اند وجود ندارند و فقط
// برای ۷ محصول اصلی کاتالوگ از productsCosmetic.js نمایش داده می‌شوند.

import { api } from "./client";
import { parseTomanPrice } from "../products";

export async function listCategories() {
  const data = await api.get("/categories/?page_size=100", { auth: true });
  return (data && data.results) || [];
}

export async function listAdminProducts() {
  const data = await api.get("/products/?page_size=100", { auth: true });
  return (data && data.results) || [];
}

/** Fetches one product (with its current images) fresh from the server —
 * used to re-sync the image list after an upload/reorder/delete, since
 * those endpoints only return the single image that changed. */
export function getAdminProduct(slug) {
  return api.get(`/products/${encodeURIComponent(slug)}/`, { auth: true });
}

/** form: the AdminProductsClient form state; categorySlug: the Category.slug to assign. */
export function buildProductPayload(form, categorySlug) {
  const payload = {
    name: form.title,
    category: categorySlug,
    short_description: form.tagline || "",
    description: form.desc || "",
    price: String(parseTomanPrice(form.price) || 0),
    stock: Number(form.stock) || 0,
    is_active: form.status !== "draft",
    is_featured: !!form.featured,
  };

  // previous_price: omit entirely when blank, rather than sending "" or 0
  // (which the backend would read as an explicit — and, at 0, invalid —
  // value instead of "no previous price").
  const previousPrice = String(form.previousPrice ?? "").trim();
  payload.previous_price = previousPrice ? String(parseTomanPrice(previousPrice)) : null;

  // size_value/size_unit: the backend requires both together or neither —
  // mirror that here so a half-filled form doesn't send a doomed request.
  const sizeValue = String(form.sizeValue ?? "").trim();
  if (sizeValue && form.sizeUnit) {
    payload.size_value = sizeValue;
    payload.size_unit = form.sizeUnit;
  } else {
    payload.size_value = null;
    payload.size_unit = "";
  }

  return payload;
}

export function createProduct(payload) {
  return api.post("/products/", payload, { auth: true });
}

export function updateProduct(slug, payload) {
  return api.patch(`/products/${encodeURIComponent(slug)}/`, payload, { auth: true });
}

export function deleteProduct(slug) {
  return api.delete(`/products/${encodeURIComponent(slug)}/`, { auth: true });
}

// ---------------------------------------------------------------------------
// Product images — staff-only nested actions on ProductViewSet.
// ---------------------------------------------------------------------------

/** file: a browser File/Blob from an <input type="file">. */
export function uploadProductImage(slug, file, { altText = "", isPrimary = false } = {}) {
  const formData = new FormData();
  formData.append("image", file);
  if (altText) formData.append("alt_text", altText);
  if (isPrimary) formData.append("is_primary", "true");
  return api.upload(`/products/${encodeURIComponent(slug)}/images/`, formData, { auth: true });
}

/** patch: any of { alt_text, sort_order, is_primary }. */
export function updateProductImage(slug, imageId, patch) {
  return api.patch(`/products/${encodeURIComponent(slug)}/images/${imageId}/`, patch, { auth: true });
}

export function setPrimaryProductImage(slug, imageId) {
  return updateProductImage(slug, imageId, { is_primary: true });
}

export function deleteProductImage(slug, imageId) {
  return api.delete(`/products/${encodeURIComponent(slug)}/images/${imageId}/`, { auth: true });
}
