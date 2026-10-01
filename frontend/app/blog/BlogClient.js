"use client";

import { useEffect, useRef, useState } from "react";
import { fetchBlogPosts } from "@/lib/api/blog";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../_shared/chrome";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

const HERO = pageHero({
  title: "وبلاگ نیکا",
  desc: "یادداشت‌هایی درباره عسل، زنبورداری و زندگی سالم",
  crumbs: [{ label: "خانه", href: "/" }, { label: "وبلاگ" }],
});

function buildGridHTML(slugs, posts) {
  if (!slugs.length) {
    return `<p class="blog-note">هنوز مقاله‌ای منتشر نشده — به‌زودی مطالب تازه اضافه می‌شود 🐝</p>`;
  }
  const cards = slugs
    .map((slug) => {
      const post = posts[slug];
      return `
    <article class="blog-card"><a class="blog-card-link" href="/blog/${slug}">
      <div class="blog-card-media"><img src="${post.image}" alt="${escapeHtml(post.title)}" loading="lazy"></div>
      <div class="blog-card-body">
        <div class="blog-card-meta"><span class="blog-card-tag">${post.tag}</span><span>${post.readTime}</span></div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
      </div>
    </a></article>`;
    })
    .join("\n");

  return `
  <div class="blog-grid">
    ${cards}
  </div>
  <p class="blog-note">مقالات بیشتر به‌زودی اضافه می‌شوند 🐝</p>`;
}

function buildPageHTML(innerHTML) {
  return `
${ICON_SPRITE}
${TOPBAR}
${HEADER}
${HERO}

<div class="container">
  ${innerHTML}
</div>

${FOOTER}
`;
}

export default function BlogClient() {
  const scriptRanRef = useRef(false);
  const [status, setStatus] = useState("loading"); // loading | ready | empty
  const [html, setHtml] = useState(buildPageHTML(`<p class="blog-note">در حال بارگذاری مقالات…</p>`));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { posts, slugs } = await fetchBlogPosts();
      if (cancelled) return;
      setStatus(slugs.length ? "ready" : "empty");
      setHtml(buildPageHTML(buildGridHTML(slugs, posts)));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    // Re-run the shared page script whenever the markup changes (loading
    // -> ready/empty), since it wires up DOM that gets replaced each time.
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
