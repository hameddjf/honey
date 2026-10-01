"use client";

import { useEffect, useRef, useState } from "react";
import buildBodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProducts } from "@/lib/products";
import { fetchSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function ShopClient() {
  const scriptRanRef = useRef(false);
  const [html, setHtml] = useState(() => buildBodyHTML(DEFAULT_SITE_CONTENT));
  const [productsBySlug, setProductsBySlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSiteContent().catch(() => DEFAULT_SITE_CONTENT),
      fetchProducts().catch(() => ({ bySlug: {} })),
    ]).then(([content, products]) => {
      if (cancelled) return;
      setHtml(buildBodyHTML(content));
      setProductsBySlug(products.bySlug);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (productsBySlug === null || scriptRanRef.current) return;
    scriptRanRef.current = true;
    window.__NIKA_PRODUCTS__ = productsBySlug;
    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
  }, [productsBySlug]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
