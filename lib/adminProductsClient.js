// لایه‌ی کلاینت برای مدیریت محصولات در پنل ادمین — از طریق API واقعی روی D1.

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

export async function fetchAdminProducts() {
  const res = await fetch("/api/admin/products", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, products: [] };
  return { ok: true, products: data.products };
}

export async function saveAdminProduct(slug, data) {
  // /api/admin/products با POST هم درج و هم به‌روزرسانی (upsert بر اساس slug) را انجام می‌دهد
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...data, slug }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.ok) return { ok: false, error: result.error || "ذخیره ناموفق بود." };
  return { ok: true, product: result.product };
}

export async function deleteAdminProduct(slug) {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const result = await res.json().catch(() => ({}));
  return { ok: res.ok && result.ok };
}
