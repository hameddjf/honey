import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import AddToCart from "@/components/AddToCart";
import { products } from "@/lib/products";
import { formatToman } from "@/lib/format";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.name} | عسل‌ستان`,
    description: product.desc,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, 3);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 90 }}>
        <section className="light-section product-detail">
          <div className="container">
            <nav className="breadcrumb">
              <a href="/">خانه</a> / <a href="/shop">فروشگاه</a> / <span>{product.name}</span>
            </nav>

            <div className="product-detail-grid">
              <ProductGallery images={product.images} name={product.name} />

              <div className="product-info">
                <div className="p-cat">{product.category}</div>
                <h1>{product.name}</h1>

                <div className="product-price-row">
                  {product.oldPrice && (
                    <span className="p-price-old lg">{formatToman(product.oldPrice)}</span>
                  )}
                  <span className="product-price-main">
                    {formatToman(product.price)} <span>تومان</span>
                  </span>
                </div>

                <p className="product-long-desc">{product.longDesc}</p>

                <ul className="product-meta">
                  <li><b>وزن:</b> {product.weight}</li>
                  <li><b>وضعیت موجودی:</b> {product.inStock ? "موجود در انبار" : "ناموجود"}</li>
                  <li><b>ارسال:</b> ۲ تا ۴ روز کاری به سراسر کشور</li>
                </ul>

                <AddToCart product={product} />

                <div className="trust-badges">
                  <div><span>✓</span> آزمایش خلوص</div>
                  <div><span>✓</span> بدون افزودنی</div>
                  <div><span>✓</span> ضمانت اصالت</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="light-section related-section">
            <div className="container">
              <div className="section-head" style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.8rem" }}>محصولات مرتبط</h2>
              </div>
              <div className="product-grid shop-grid">
                {related.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
