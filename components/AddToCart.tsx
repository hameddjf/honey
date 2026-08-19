"use client";

import { useState } from "react";
import { Product } from "@/lib/products";

export default function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!product.inStock) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="add-to-cart">
      <div className="qty-stepper">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="کاهش تعداد"
          disabled={!product.inStock}
        >
          −
        </button>
        <span>{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          aria-label="افزایش تعداد"
          disabled={!product.inStock}
        >
          +
        </button>
      </div>

      <button
        className={`btn-primary add-btn ${added ? "added" : ""}`}
        onClick={handleAdd}
        disabled={!product.inStock}
      >
        {!product.inStock ? "ناموجود" : added ? "افزوده شد ✓" : "افزودن به سبد خرید"}
      </button>
    </div>
  );
}
