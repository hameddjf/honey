import Link from "next/link";
import { Product } from "@/lib/products";
import { formatToman } from "@/lib/format";

export default function ProductCard({
  product,
  featured = false,
}: {
  product: Product;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`p-card block ${featured ? "p-card--featured" : ""}`}
    >
      <div className="p-media">
        {product.tag && <span className="p-tag">{product.tag}</span>}
        {!product.inStock && <span className="p-tag p-tag--out">ناموجود</span>}
        <img src={product.images[0]} alt={product.name} loading="lazy" />
      </div>
      <div className="p-body">
        <div className="p-cat">{product.category}</div>
        <h3>{product.name}</h3>
        <p>{product.desc}</p>
        <div className="p-foot">
          <div className="p-price">
            {product.oldPrice && (
              <span className="p-price-old">{formatToman(product.oldPrice)}</span>
            )}
            {formatToman(product.price)} <span>تومان</span>
          </div>
          <span className="p-add" aria-hidden>
            {product.inStock ? "+" : "×"}
          </span>
        </div>
      </div>
    </Link>
  );
}
