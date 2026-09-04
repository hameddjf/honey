import { notFound } from "next/navigation";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/products";
import ProductClient from "./ProductClient";

// NOTE (Phase 1 scope): generateStaticParams/generateMetadata/notFound below
// still read from the static lib/products.js snapshot rather than D1. This is
// intentional — every existing D1 read in this codebase happens inside an
// app/api/*/route.js Route Handler; there is no precedent for reading
// `cloudflare:workers` env from a Server Component page, and this could not
// be verified against the Workers runtime in this environment. The actual
// customer-facing rendering (price, all display fields) now comes from D1 —
// see ProductClient. Practical effect of this gap: a brand-new admin-created
// product may 404 here until this file is also migrated to D1, following the
// pattern in app/api/products/route.js, and verified via `wrangler dev`.
export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = PRODUCTS[slug];
  if (!product) return {};
  return {
    title: `${product.title} | عسل طبیعی نیکا`,
    description: product.desc,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  if (!PRODUCTS[slug]) {
    notFound();
  }
  return <ProductClient slug={slug} />;
}
