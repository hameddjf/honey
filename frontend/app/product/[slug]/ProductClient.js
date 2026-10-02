"use client";

import { useEffect, useRef, useState } from "react";
import buildBodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProductsSafe } from "@/lib/products";
import { fetchSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function ProductClient({ slug }) {
  const scriptRanRef = useRef(false);
  const [html, setHtml] = useState(() => buildBodyHTML(DEFAULT_SITE_CONTENT));
  const [productsBySlug, setProductsBySlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSiteContent().catch(() => DEFAULT_SITE_CONTENT),
      fetchProductsSafe(),
    ]).then(([content, products]) => {
      if (cancelled) return;
      setHtml(buildBodyHTML(content));
      setProductsBySlug(products.bySlug);
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

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
