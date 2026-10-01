"use client";

import { useEffect, useRef, useState } from "react";
import buildBodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchProducts } from "@/lib/products";
import { fetchSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function Home() {
  const scriptRanRef = useRef(false);
  const [html, setHtml] = useState(() => buildBodyHTML(DEFAULT_SITE_CONTENT));
  const [productsBySlug, setProductsBySlug] = useState(null);

  // اول با محتوای پیش‌فرض رندر می‌کنیم (بدون صفحه‌ی خالی)، بعد محتوای زنده‌ی
  // Django (هیرو/تاپ‌بار/فوتر) و کاتالوگ محصولات را می‌گیریم و یک‌جا جایگزین می‌کنیم.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSiteContent().catch(() => DEFAULT_SITE_CONTENT),
      fetchProducts().catch(() => ({ bySlug: {} })),
    ]).then(([content, products]) => {
      if (cancelled) return;
      setHtml(buildBodyHTML(content, products.bySlug));
      setProductsBySlug(products.bySlug);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // اسکریپت verbatim این صفحه فقط بعد از اینکه HTML نهایی (با محتوای زنده)
  // در DOM نشست اجرا می‌شود — وگرنه یک تغییر بعدی در html می‌توانست کارت‌های
  // محصول تزریق‌شده توسط همین اسکریپت را از بین ببرد.
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
