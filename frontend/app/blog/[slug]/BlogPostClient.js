"use client";

import { useEffect, useRef, useState } from "react";
import { fetchBlogPost, fetchBlogPosts } from "@/lib/api/blog";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, commonScript } from "../../_shared/chrome";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function buildLoadingHTML() {
  return `
${ICON_SPRITE}
${TOPBAR}
${HEADER}
<div class="container" style="padding: 80px 0; text-align: center;">
  <p>در حال بارگذاری مقاله…</p>
</div>
${FOOTER}
`;
}

function buildErrorHTML() {
  return `
${ICON_SPRITE}
${TOPBAR}
${HEADER}
<div class="container" style="padding: 80px 0; text-align: center;">
  <p>مقاله پیدا نشد یا در حال حاضر در دسترس نیست.</p>
  <p><a href="/blog">بازگشت به وبلاگ</a></p>
</div>
${FOOTER}
`;
}

function buildBodyHTML(post, relatedPosts) {
  const relatedHTML = relatedPosts
    .map(
      (r) => `
      <article class="blog-card"><a class="blog-card-link" href="/blog/${r.slug}">
        <div class="blog-card-media"><img src="${r.image}" alt="${escapeHtml(r.title)}" loading="lazy"></div>
        <div class="blog-card-body">
          <div class="blog-card-meta"><span class="blog-card-tag">${r.tag}</span><span>${r.readTime}</span></div>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.excerpt)}</p>
        </div>
      </a></article>`
    )
    .join("\n");

  const bodyBlocks = post.content
    .map((block) => (block.h ? `<h2>${escapeHtml(block.h)}</h2>` : `<p>${escapeHtml(block.p)}</p>`))
    .join("\n");

  return `
${ICON_SPRITE}
${TOPBAR}
${HEADER}

<section class="post-hero">
  <div class="container">
    <div class="breadcrumb">
      <a href="/">خانه</a>
      <svg class="icon icon-xs"><use href="#i-chev-left"/></svg>
      <a href="/blog">وبلاگ</a>
      <svg class="icon icon-xs"><use href="#i-chev-left"/></svg>
      <span>${escapeHtml(post.title)}</span>
    </div>
    <span class="blog-card-tag">${post.tag}</span>
    <h1>${escapeHtml(post.title)}</h1>
    <div class="post-meta">
      <span><svg class="icon icon-sm"><use href="#i-user"/></svg>${post.author}</span>
      <span>${post.date}</span>
      <span>${post.readTime}</span>
    </div>
  </div>
</section>

<div class="post-cover">
  <img src="${post.image}" alt="${escapeHtml(post.title)}">
</div>

<div class="post-wrap">
  <div class="post-body">
    ${bodyBlocks}
  </div>
</div>

<div class="post-share">
  <span>اشتراک‌گذاری:</span>
  <a href="#" class="icon-btn" aria-label="اینستاگرام"><svg class="icon"><use href="#i-instagram"/></svg></a>
  <a href="#" class="icon-btn" aria-label="تلگرام"><svg class="icon"><use href="#i-telegram"/></svg></a>
  <a href="#" class="icon-btn" aria-label="واتساپ"><svg class="icon"><use href="#i-whatsapp"/></svg></a>
</div>

${relatedPosts.length ? `
<div class="related-posts">
  <h3>مقالات مرتبط</h3>
  <div class="related-grid">
    ${relatedHTML}
  </div>
</div>` : ""}

${FOOTER}
`;
}

export default function BlogPostClient({ slug }) {
  const scriptRanRef = useRef(false);
  const [status, setStatus] = useState("loading"); // loading | ready | not-found
  const [html, setHtml] = useState(buildLoadingHTML());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setHtml(buildLoadingHTML());

      const [{ post }, { posts: allPosts }] = await Promise.all([fetchBlogPost(slug), fetchBlogPosts()]);
      if (cancelled) return;

      if (!post) {
        setStatus("not-found");
        setHtml(buildErrorHTML());
        return;
      }

      const relatedPosts = Object.keys(allPosts)
        .filter((s) => s !== slug)
        .slice(0, 3)
        .map((s) => ({ slug: s, ...allPosts[s] }));

      setStatus("ready");
      setHtml(buildBodyHTML(post, relatedPosts));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (status === "loading") return;
    // Re-run the shared page script every time the markup actually changes
    // (loading -> ready/not-found), not just on mount, since the DOM it
    // wires up (nav toggle, header scroll, etc.) is replaced each time.
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    scriptRanRef.current = true;

    return () => {
      script.remove();
    };
  }, [status]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
