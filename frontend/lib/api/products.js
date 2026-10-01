// فراخوانی‌های خام API برای محصولات و دسته‌بندی‌ها.
// این فایل فقط envelope خام بک‌اند را برمی‌گرداند؛ نگاشت به شکل مصرفی
// فرانت (کلید=اسلاگ فرانت، فرمت قیمت فارسی و ...) در lib/products.js است.

import { api } from "./client";

/** خواندن همه‌ی صفحات یک اندپوینت paginated و برگرداندن آرایه‌ی یکجا. */
async function fetchAllPages(path, { auth = false } = {}) {
  let url = path;
  const results = [];
  let guard = 0;
  while (url && guard < 20) {
    guard += 1;
    const page = await api.get(url, { auth });
    if (Array.isArray(page)) {
      results.push(...page);
      break;
    }
    results.push(...(page.results || []));
    if (!page.next) break;
    // page.next یک URL کامل است؛ فقط بخش نسبی بعد از base را نگه می‌داریم.
    const nextUrl = new URL(page.next);
    url = `${nextUrl.pathname.replace(/^\/api\/v1/, "")}${nextUrl.search}`;
  }
  return results;
}

export async function fetchProductsRaw({ staff = false } = {}) {
  return fetchAllPages("/products/?page_size=100", { auth: staff });
}

export async function fetchCategoriesRaw({ staff = false } = {}) {
  return fetchAllPages("/categories/?page_size=100", { auth: staff });
}

export async function fetchProductBySlugRaw(slug) {
  return api.get(`/products/${encodeURIComponent(slug)}/`, { auth: false });
}

export async function createProductRaw(payload) {
  return api.post("/products/", payload);
}

export async function updateProductRaw(slug, payload) {
  return api.patch(`/products/${encodeURIComponent(slug)}/`, payload);
}

export async function deleteProductRaw(slug) {
  return api.delete(`/products/${encodeURIComponent(slug)}/`);
}

export async function createCategoryRaw(payload) {
  return api.post("/categories/", payload);
}
