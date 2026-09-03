"use client";

import { useEffect, useRef } from "react";
import bodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import ProductGrid from "@/components/ProductGrid";

const [beforeGrid, afterGrid] = bodyHTML.split("SHOP_PRODUCT_GRID_MARKER");

export default function ShopPage() {
  const scriptRanRef = useRef(false);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;

    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: beforeGrid }} />
      <ProductGrid variant="shop" />
      <div dangerouslySetInnerHTML={{ __html: afterGrid }} />
    </>
  );
}
