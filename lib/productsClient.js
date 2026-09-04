// لایه‌ی کلاینت برای خواندن کاتالوگ محصولات از منبع معتبر (D1 از طریق /api/products)
// و تبدیل آن به یک نگاشت بر اساس slug — جایگزینی برای دادهٔ ایستای lib/products.js
// در مصرف‌کننده‌های سمت کلاینت (صفحه محصول، سبد خرید، تسویه‌حساب).

export async function fetchProductsMap() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json().catch(() => null);
    if (!data?.ok || !Array.isArray(data.products)) return {};
    const map = {};
    for (const p of data.products) {
      if (p?.slug) map[p.slug] = p;
    }
    return map;
  } catch {
    return {};
  }
}
