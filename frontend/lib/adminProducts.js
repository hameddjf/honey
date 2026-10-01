// لایه‌ی مدیریت محصولات برای پنل ادمین — نسخه‌ی دمو.
// PRODUCTS از lib/products.js «منبع اصلی» باقی می‌ماند (همون چیزی که فروشگاه
// واقعی ازش می‌خونه). این فایل یک override محلی روی همون داده اعمال می‌کند
// تا بدون بک‌اند هم بشه افزودن/ویرایش/حذف را در پنل ادمین امتحان کرد.

import { PRODUCTS as BASE_PRODUCTS } from "./products";

const OVERRIDE_KEY = "nika_admin_products_override"; // { [slug]: partialProduct }
const DELETED_KEY = "nika_admin_products_deleted"; // [slug, ...]

export const PRODUCT_CATEGORIES = ["عسل‌ها", "ژل رویال و ترکیبات ویژه"];

// متادیتای مدیریتی (موجودی/وضعیت/ویژه) که در lib/products.js عمومی
// وجود ندارد — چون آن فایل منبع «فروشگاه عمومی» است و نباید برای نیازهای
// فقط-ادمین شلوغ شود. دسته‌بندی (category) دیگر اینجا تکرار نمی‌شود؛ چون
// یک ویژگی «عمومی/قابل‌مشاهده برای مشتری» است، از همان lib/products.js
// (BASE_PRODUCTS) خوانده می‌شود تا فقط یک منبع حقیقت برای آن وجود داشته باشد.
const DEFAULT_ADMIN_META = {
  citrus: { stock: 42, featured: true, status: "active" },
  dark: { stock: 18, featured: true, status: "active" },
  forest: { stock: 6, featured: false, status: "active" },
  sunflower: { stock: 27, featured: false, status: "active" },
  blossom: { stock: 9, featured: false, status: "active" },
  khareshtor: { stock: 14, featured: false, status: "active" },
  mix: { stock: 3, featured: true, status: "active" },
};
const FALLBACK_META = { category: PRODUCT_CATEGORIES[0], stock: 0, featured: false, status: "active" };

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function slugify(title) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "product-" + Date.now()
  );
}

// همه‌ی محصولات مؤثر (پیش‌فرض + override) به‌شکل آرایه برای جدول ادمین
export function getEffectiveProducts() {
  const overrides = readJSON(OVERRIDE_KEY, {});
  const deleted = new Set(readJSON(DELETED_KEY, []));

  const merged = { ...BASE_PRODUCTS };
  for (const [slug, patch] of Object.entries(overrides)) {
    merged[slug] = { ...(merged[slug] || {}), ...patch };
  }
  for (const slug of deleted) delete merged[slug];

  return Object.entries(merged).map(([slug, p]) => ({
    slug,
    ...(DEFAULT_ADMIN_META[slug] || FALLBACK_META),
    ...p,
  }));
}

export function getProduct(slug) {
  return getEffectiveProducts().find((p) => p.slug === slug) || null;
}

export function upsertProduct(slug, data) {
  const overrides = readJSON(OVERRIDE_KEY, {});
  const base = { ...FALLBACK_META, ...(DEFAULT_ADMIN_META[slug] || {}), ...(BASE_PRODUCTS[slug] || {}) };
  overrides[slug] = { ...base, ...(overrides[slug] || {}), ...data };
  writeJSON(OVERRIDE_KEY, overrides);

  // اگه قبلاً حذف شده بود ولی الان دوباره ذخیره می‌شه، از لیست حذف‌شده‌ها درش بیار
  const deleted = readJSON(DELETED_KEY, []).filter((s) => s !== slug);
  writeJSON(DELETED_KEY, deleted);
}

export function deleteProduct(slug) {
  const deleted = readJSON(DELETED_KEY, []);
  if (!deleted.includes(slug)) {
    deleted.push(slug);
    writeJSON(DELETED_KEY, deleted);
  }
}

export function resetProductOverrides() {
  try {
    localStorage.removeItem(OVERRIDE_KEY);
    localStorage.removeItem(DELETED_KEY);
  } catch {}
}
