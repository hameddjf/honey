import { notFound } from "next/navigation";
import { PRODUCTS, PRODUCT_SLUGS } from "@/lib/products";
import ProductClient from "./ProductClient";

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
