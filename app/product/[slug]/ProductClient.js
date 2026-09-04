"use client";

import { useEffect, useRef, useState } from "react";
import bodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProductsMap } from "@/lib/productsClient";

export default function ProductClient({ slug }) {
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

    // Expose the slug from the dynamic route segment, and the live product
    // catalog, so the (verbatim) demo script can pick the right product
    // without relying on a ?p= query param or stale embedded data.
    window.__PRODUCT_SLUG__ = slug;
    window.__NIKA_PRODUCTS__ = productsMap;

    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, [slug, productsMap]);

  if (!productsMap) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        در حال بارگذاری محصول...
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />;
}
