import { notFound } from "next/navigation";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/products";
import ProductClient from "./ProductClient";
import { absoluteUrl, productJsonLd, breadcrumbJsonLd, jsonLdProps } from "@/lib/seo";
import { serverFetchJson } from "@/lib/serverApi";

export const revalidate = 300;

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

// Django is the source of truth for name/price/stock/images. The offline
// cosmetic catalog is only a fallback (and never supplies a price, so stale
// numbers can't leak into structured data).
async function loadProduct(slug) {
  const cosmetic = PRODUCTS[slug] || null;
  const api = await serverFetchJson(`/products/${encodeURIComponent(slug)}/`);
  if (api && api.is_active !== false) {
    const images = [...(api.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    return {
      title: api.name,
      desc: api.short_description || cosmetic?.desc || "",
      image: images[0]?.url || cosmetic?.image,
      priceValue: parseFloat(api.price),
      inStock: api.is_in_stock,
    };
  }
  if (cosmetic) {
    return { title: cosmetic.title, desc: cosmetic.desc, image: cosmetic.image, priceValue: undefined, inStock: undefined };
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { robots: { index: false, follow: false } };
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
    twitter: { card: "summary_large_image", title: product.title, description: product.desc },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
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
            priceValue: product.priceValue,
            inStock: product.inStock,
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
