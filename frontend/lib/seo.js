// ابزارهای مشترک سئو: آدرس کانونیک سایت + سازنده‌های JSON-LD.
//
// عمداً بدون هیچ fetch به بک‌اند — چون این‌ها هم در صفحاتی استفاده می‌شوند
// که در زمان build به‌صورت استاتیک ساخته می‌شوند (مثل صفحه‌ی هر محصول)، و
// build نباید به در دسترس‌بودن سرور جنگو وابسته باشد.

// خودِ دامنه‌ی تولید هیچ‌وقت این‌جا hardcode نمی‌شود — همیشه از
// NEXT_PUBLIC_SITE_URL خوانده می‌شود؛ در توسعه‌ی محلی روی localhost می‌افتد.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const SITE_NAME = "عسل طبیعی نیکا";

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** JSON-LD <script> props — spread onto a <script type="application/ld+json" ...>. */
export function jsonLdProps(data) {
  return { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data) } };
}

/**
 * Organization schema for the whole site (layout-level). Only real,
 * already-known project facts — no fabricated address/phone/ratings. A
 * real logo/sameAs (social profile) URL can be added once one is
 * confirmed; omitted for now rather than guessed.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** crumbs: [{ label, href }] — same shape already used by pageHero()/breadcrumb UI. */
export function breadcrumbJsonLd(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

/**
 * Product schema. price/availability only — no ratings/reviews are
 * fabricated (there is no real review data in this project).
 */
export function productJsonLd({ name, description, image, url, priceValue, inStock, sku }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      availability: inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };
  if (image) data.image = image;
  if (priceValue !== undefined && priceValue !== null) data.offers.price = String(priceValue);
  if (sku) data.sku = sku;
  return data;
}

/** BlogPosting schema for a published blog article. */
export function blogPostingJsonLd({ title, description, image, url, datePublished, author }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  if (image) data.image = image;
  if (datePublished) data.datePublished = datePublished;
  if (author) data.author = { "@type": "Person", name: author };
  return data;
}
