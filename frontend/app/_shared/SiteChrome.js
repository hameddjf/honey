"use client";

// نسخه‌ی «زنده»ی تاپ‌بار/هدر و فوتر — برای صفحاتی که قبلاً از رشته‌های
// استاتیک TOPBAR/HEADER/FOOTER در app/_shared/chrome.js استفاده می‌کردند.
//
// اولین رندر با DEFAULT_SITE_CONTENT انجام می‌شود (بدون صفحه‌ی خالی)؛ به محض
// برگشت GET /api/v1/content/ محتوای واقعی جای آن را می‌گیرد. یک Promise
// مشترک (loadSharedContent) بین همه‌ی صفحات این جلسه به اشتراک گذاشته
// می‌شود تا با وجود استفاده در چندین صفحه، فقط یک درخواست واقعی به بک‌اند
// زده شود — نه یک درخواست جدا به‌ازای هر صفحه.

import { useEffect, useState } from "react";
import { ICON_SPRITE, HEADER, buildTopbar, buildFooter } from "./chrome";
import { DEFAULT_SITE_CONTENT, fetchSiteContent } from "@/lib/siteContent";

let sharedContentPromise = null;

function loadSharedContent() {
  if (!sharedContentPromise) sharedContentPromise = fetchSiteContent();
  return sharedContentPromise;
}

function useLiveSiteContent() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  useEffect(() => {
    let cancelled = false;
    loadSharedContent().then((live) => {
      if (!cancelled) setContent(live);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return content;
}

/** Drop-in replacement for `dangerouslySetInnerHTML={{ __html: ICON_SPRITE + TOPBAR + HEADER }}`. */
export function PublicTopbarHeader() {
  const content = useLiveSiteContent();
  return <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE + buildTopbar(content) + HEADER }} />;
}

/** Drop-in replacement for `dangerouslySetInnerHTML={{ __html: FOOTER }}`. */
export function PublicFooter() {
  const content = useLiveSiteContent();
  return <div dangerouslySetInnerHTML={{ __html: buildFooter(content) }} />;
}
