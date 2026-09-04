"use client";

import { useEffect, useRef, useState } from "react";
import bodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProductsMap } from "@/lib/productsClient";

export default function CartPage() {
  const scriptRanRef = useRef(false);
  const [productsMap, setProductsMap] = useState(null); // null = در حال بارگذاری

  // Load the authoritative product catalog (D1 via /api/products) instead of
  // trusting the frozen literal PRODUCTS object baked into the demo script.
  useEffect(() => {
    let cancelled = false;
    fetchProductsMap().then((map) => {
      if (!cancelled) setProductsMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!productsMap || scriptRanRef.current) return;
    scriptRanRef.current = true;

    window.__NIKA_PRODUCTS__ = productsMap;

    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, [productsMap]);

  if (!productsMap) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        در حال بارگذاری سبد خرید...
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />;
}
