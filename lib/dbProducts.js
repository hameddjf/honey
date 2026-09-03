// نگاشت بین ردیف جدول D1 و شکل آبجکت محصول که فرانت انتظارش را دارد
export function rowToProduct(row) {
  if (!row) return null;
  const { benefits, description, old_price, sort_order, created_at, updated_at, ...rest } = row;
  const product = { ...rest, desc: description };
  if (old_price) product.oldPrice = old_price;
  try {
    product.benefits = benefits ? JSON.parse(benefits) : [];
  } catch {
    product.benefits = [];
  }
  return product;
}

export function productToRow(slug, data) {
  return {
    slug,
    title: data.title || "",
    tagline: data.tagline || "",
    emoji: data.emoji || "",
    price: data.price || "",
    old_price: data.oldPrice || null,
    weight: data.weight || "",
    badge: data.badge || null,
    origin: data.origin || "",
    harvest: data.harvest || "",
    purity: data.purity || "",
    image: data.image || "",
    description: data.desc || "",
    benefits: JSON.stringify(data.benefits || []),
    sort_order: data.sort_order ?? 0,
  };
}
