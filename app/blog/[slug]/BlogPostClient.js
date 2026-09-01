"use client";

import { useEffect, useRef } from "react";
import { getBlogPost, getRelatedBlogSlugs, BLOG_POSTS } from "@/lib/blog";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../../_shared/chrome";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function buildBodyHTML(slug) {
  const post = getBlogPost(slug);
  if (!post) return "";

  const relatedHTML = getRelatedBlogSlugs(slug, 3)
    .map((rSlug) => {
      const r = BLOG_POSTS[rSlug];
      return `
      <article class="blog-card"><a class="blog-card-link" href="/blog/${rSlug}">
        <div class="blog-card-media"><img src="${r.image}" alt="${escapeHtml(r.title)}" loading="lazy"></div>
        <div class="blog-card-body">
          <div class="blog-card-meta"><span class="blog-card-tag">${r.tag}</span><span>${r.readTime}</span></div>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.excerpt)}</p>
        </div>
      </a></article>`;
    })
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

<div class="related-posts">
  <h3>مقالات مرتبط</h3>
  <div class="related-grid">
    ${relatedHTML}
  </div>
</div>

${FOOTER}
`;
}

export default function BlogPostClient({ slug }) {
  const scriptRanRef = useRef(false);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;

    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: buildBodyHTML(slug) }} />;
}
