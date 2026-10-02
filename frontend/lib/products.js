// لایه‌ی داده‌ی محصولات — نسخه‌ی متصل به بک‌اند جنگو.
//
// حقیقت زمان اجرا (قیمت/موجودی/فعال‌بودن/دسته‌بندی) همیشه از
// GET /api/v1/products/ خوانده می‌شود. محتوای تزئینی (تصویر/ایموجی/تگ‌لاین/
// بنفیت‌ها) در productsCosmetic.js نگه‌داری می‌شود چون در بک‌اند وجود ندارد
// و نباید هم داشته باشد.
//
// اسلاگ مسیر عمومی (/product/[slug]) عمداً پایدار و انگلیسی نگه داشته شده
// (citrus, dark, ...) تا لینک‌های موجود نشکنند — حتی با اینکه اسلاگ خودِ
// جنگو یک slugify فارسی از نام محصول است. نگاشت نام محصول ↔ اسلاگ پایدار
// در SLUG_BY_NAME زیر است.

import { api } from "./api/client";
import { COSMETIC_PRODUCTS } from "./productsCosmetic";

const SLUG_BY_NAME = {
  "عسل مرکبات": "citrus",
  "عسل کلزا": "sunflower",
  "عسل سیاه تلو": "dark",
  "عسل نمدار": "forest",
  "عسل خارشتر": "khareshtor",
  "عسل ترنجبین": "blossom",
  "عسل + ژل رویال": "mix",
};

function toPersianDigits(str) {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

/** Formats a Django decimal-string price like "450000.00" as "۴۵۰,۰۰۰". */
export function formatToman(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = Math.round(parseFloat(value));
  if (Number.isNaN(num)) return "";
  return toPersianDigits(num.toLocaleString("en-US"));
}

/** Parses a Persian-formatted price string (or a plain number) back to an integer. */
export function parseTomanPrice(value) {
  if (typeof value === "number") return value;
  const ascii = String(value)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[^0-9]/g, "");
  return parseInt(ascii || "0", 10);
}

function slugFor(product) {
  return SLUG_BY_NAME[product.name] || product.slug;
}

export const SIZE_UNIT_LABELS = {
  g: "گرم",
  kg: "کیلوگرم",
  ml: "میلی‌لیتر",
  L: "لیتر",
  piece: "عدد",
  pack: "بسته",
  box: "جعبه",
  jar: "شیشه",
};

/** e.g. size_value=450, size_unit="g" -> "۴۵۰ گرم". Empty string if either is missing. */
function formatSizeLabel(product) {
  if (product.size_value === null || product.size_value === undefined || !product.size_unit) return "";
  const value = Math.round(parseFloat(product.size_value) * 100) / 100;
  if (Number.isNaN(value)) return "";
  const valueStr = toPersianDigits(Number.isInteger(value) ? value : value.toFixed(2));
  return `${valueStr} ${SIZE_UNIT_LABELS[product.size_unit] || product.size_unit}`;
}

export function mergeCosmetic(product) {
  const slug = slugFor(product);
  const cosmetic = COSMETIC_PRODUCTS[slug] || {};
  // Django is the source of truth for images once a product actually has
  // any uploaded — the static cosmetic image is only a launch-day fallback
  // for the original 7 products, used while no real photo has been
  // uploaded for them yet in /admin/products.
  const apiImages = Array.isArray(product.images) ? product.images : [];
  const sortedApiImages = [...apiImages].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  // Local (same-domain) images shipped in /public/images/products — these are
  // used when the product has no uploaded images yet, and as a safety net
  // (see data-fallback / onerror in the page templates) if an uploaded image's
  // URL fails to load (e.g. backend media not reachable).
  const fallbackImages = [cosmetic.image, cosmetic.imageDetail].filter(Boolean);
  const images = sortedApiImages.length
    ? sortedApiImages.map((img) => img.url)
    : fallbackImages;
  return {
    ...cosmetic,
    id: product.id,
    slug,
    apiSlug: product.slug,
    category: cosmetic.category || product.category,
    title: product.name,
    tagline: cosmetic.tagline || product.short_description,
    desc: product.description || cosmetic.desc,
    price: formatToman(product.price),
    priceValue: parseFloat(product.price),
    oldPrice: product.previous_price ? formatToman(product.previous_price) : undefined,
    stock: product.stock,
    isInStock: product.is_in_stock,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    // Real package size from Django — replaces the old hardcoded cosmetic
    // "weight" string as the source of truth. sizeLabel is "" when the
    // product has neither size_value nor size_unit set.
    sizeValue: product.size_value ?? null,
    sizeUnit: product.size_unit || "",
    sizeLabel: formatSizeLabel(product),
    // Real uploaded images from Django, falling back to the single static
    // cosmetic image only when the product has none yet.
    images,
    image: images[0] || cosmetic.image,
    fallbackImage: cosmetic.image || "",
    fallbackImages,
  };
}

let cache = null; // { bySlug, list, slugs } — populated by fetchProducts()

/**
 * Fetches the live product catalog from Django and merges it with cosmetic
 * metadata. Caches in-memory for the lifetime of the page/session; pass
 * { force: true } to bypass the cache (e.g. after an admin edit).
 */
export async function fetchProducts({ force = false } = {}) {
  if (cache && !force) return cache;
  const data = await api.get("/products/?page_size=100", { auth: false });
  const results = (data && data.results) || [];
  const bySlug = {};
  for (const product of results) {
    if (!product.is_active) continue;
    bySlug[slugFor(product)] = mergeCosmetic(product);
  }
  cache = { bySlug, list: Object.values(bySlug), slugs: Object.keys(bySlug) };
  return cache;
}

/**
 * کاتالوگ آفلاین (فقط داده‌ی تزئینی، بدون قیمت/موجودی زنده).
 * وقتی بک‌اند در دسترس نیست (لوکال بدون runserver، Render در حال بیدار شدن،
 * CORS و ...) به‌جای «لیست خالی» این را برمی‌گردانیم تا مودال صفحه‌ی اصلی و
 * صفحه‌ی محصول همچنان کار کنند. هرگز در cache ذخیره نمی‌شود تا با برگشتن
 * بک‌اند، بار بعد داده‌ی واقعی بیاید.
 */
export function offlineCatalog() {
  const bySlug = {};
  for (const [slug, cosmetic] of Object.entries(COSMETIC_PRODUCTS)) {
    const images = [cosmetic.image, cosmetic.imageDetail].filter(Boolean);
    bySlug[slug] = {
      ...cosmetic,
      slug,
      images,
      image: cosmetic.image,
      fallbackImage: cosmetic.image || "",
      fallbackImages: images,
      offline: true,
    };
  }
  return { bySlug, list: Object.values(bySlug), slugs: Object.keys(bySlug), offline: true };
}

/**
 * مثل fetchProducts ولی هرگز throw نمی‌کند و هرگز لیست خالی نمی‌دهد:
 * اگر API خطا بدهد یا هیچ محصول فعالی نیاورد، کاتالوگ آفلاین برمی‌گردد.
 * صفحه‌های نمایشی (home / shop / product) باید از این استفاده کنند.
 */
export async function fetchProductsSafe(opts) {
  try {
    const data = await fetchProducts(opts);
    if (data && data.slugs && data.slugs.length) return data;
  } catch {
    // ignore — fall through to offline catalog
  }
  return offlineCatalog();
}

export function getCachedProducts() {
  return cache;
}

// Build-time / offline fallback only (cosmetic data, no live price/stock).
// Never used once fetchProducts() has resolved — see getProduct() below.
export const PRODUCTS = COSMETIC_PRODUCTS;
export const PRODUCT_SLUGS = Object.keys(COSMETIC_PRODUCTS);

/** Sync lookup: real data if fetchProducts() already ran this session, else the cosmetic fallback. */
export function getProduct(slug) {
  if (cache && cache.bySlug[slug]) return cache.bySlug[slug];
  return PRODUCTS[slug] || null;
}

export function getRelatedSlugs(slug, count = 4) {
  const slugs = (cache && cache.slugs) || PRODUCT_SLUGS;
  return slugs.filter((k) => k !== slug).slice(0, count);
}

/** Reverse lookup used by the admin panel to attach cosmetic metadata to an API product by name. */
export function stableSlugForName(name) {
  return SLUG_BY_NAME[name] || null;
}
