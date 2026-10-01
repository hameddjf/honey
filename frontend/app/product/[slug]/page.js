import { notFound } from "next/navigation";
import { PRODUCTS, PRODUCT_SLUGS, parseTomanPrice } from "@/lib/products";
import ProductClient from "./ProductClient";
import { absoluteUrl, productJsonLd, breadcrumbJsonLd, jsonLdProps } from "@/lib/seo";

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

// Runs at BUILD time for these statically-generated product routes, so it
// must stay backend-independent — built from the offline cosmetic catalog
// (lib/productsCosmetic.js), not a live fetch. The visible page content
// (live price/stock) is still refreshed client-side by ProductClient; only
// this metadata/JSON-LD reflects the catalog as of the last deploy.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = PRODUCTS[slug];
  if (!product) return {};
  const url = absoluteUrl(`/product/${slug}`);
  const image = product.image ? absoluteUrl(product.image) : undefined;
  return {
    title: product.title,
    description: product.desc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.desc,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.desc,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = PRODUCTS[slug];
  if (!product) {
    notFound();
  }
  const url = absoluteUrl(`/product/${slug}`);

  return (
    <>
      <script
        {...jsonLdProps(
          productJsonLd({
            name: product.title,
            description: product.desc,
            image: product.image ? absoluteUrl(product.image) : undefined,
            url,
            priceValue: parseTomanPrice(product.price),
            sku: slug,
          })
        )}
      />
      <script
        {...jsonLdProps(
          breadcrumbJsonLd([
            { label: "خانه", href: "/" },
            { label: "فروشگاه", href: "/shop" },
            { label: product.title },
          ])
        )}
      />
      <ProductClient slug={slug} />
    </>
  );
}
