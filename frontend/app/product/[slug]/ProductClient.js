"use client";

import { useEffect, useRef, useState } from "react";
import buildBodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProducts, PRODUCTS } from "@/lib/products";
import ProductSocial from "./ProductSocial";
import { fetchSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function ProductClient({ slug }) {
  const scriptRanRef = useRef(false);
  const [html, setHtml] = useState(() => buildBodyHTML(DEFAULT_SITE_CONTENT));
  const [productsBySlug, setProductsBySlug] = useState(null);
  const [mounts, setMounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSiteContent().catch(() => DEFAULT_SITE_CONTENT),
      fetchProducts().catch(() => ({ bySlug: {} })),
    ]).then(([content, products]) => {
      if (cancelled) return;
      setHtml(buildBodyHTML(content));
      // If the API is unreachable, still render from the offline catalog instead of a blank page.
      const live = products.bySlug || {};
      setProductsBySlug(
        Object.keys(live).length
          ? live
          : Object.fromEntries(
              Object.entries(PRODUCTS).map(([k, v]) => [
                k,
                { ...v, price: v.price || "", images: v.images || (v.image ? [v.image] : []), fallbackImage: v.image || "" },
              ])
            )
      );
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (productsBySlug === null || scriptRanRef.current) return;
    scriptRanRef.current = true;
    // Expose the slug from the dynamic route segment so the (verbatim) demo
    // script can pick the right product without relying on a ?p= query param.
    window.__PRODUCT_SLUG__ = slug;
    window.__NIKA_PRODUCTS__ = productsBySlug;
    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
  }, [productsBySlug, slug]);

  // (Re)locate the mount points whenever the markup is rebuilt.
  useEffect(() => {
    if (productsBySlug === null) return;
    setMounts({
      rating: document.getElementById("pdRatingMount"),
      react: document.getElementById("pdReactMount"),
      reviews: document.getElementById("reviewsMount"),
      tab: document.getElementById("pdReviewsTab"),
    });
  }, [html, productsBySlug]);

  const apiSlug = productsBySlug?.[slug]?.apiSlug || slug;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {mounts && <ProductSocial slug={apiSlug} mounts={mounts} />}
    </>
  );
}
