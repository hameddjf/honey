// منبع اصلی داده‌ی مقالات وبلاگ — از بک‌اند جنگو (content.BlogPost).
//
// Django BlogPost = source of truth. frontend/lib/blog.js (داده‌ی محلی
// قدیمی) صرفاً به‌عنوان fallback زمانی استفاده می‌شود که API در دسترس
// نباشد (مثلاً هنگام build استاتیک در Cloudflare، یا قطعی موقت بک‌اند) —
// هیچ‌کدام از صفحات عمومی وبلاگ دیگر مستقیماً از آن فایل نمی‌خوانند.

import { api } from "./client";
import { BLOG_POSTS as LOCAL_BLOG_POSTS, BLOG_SLUGS as LOCAL_BLOG_SLUGS } from "../blog";

/** Rough Persian "N دقیقه مطالعه" estimate from plain-text word count. */
function estimateReadTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${toFaDigits(minutes)} دقیقه مطالعه`;
}

function toFaDigits(value) {
  const map = { 0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹" };
  return String(value).replace(/[0-9]/g, (d) => map[d]);
}

/** Formats an ISO datetime as a Persian (Jalali) calendar date string, e.g. "۱۲ خرداد ۱۴۰۴". */
function formatJalaliDate(isoString) {
  if (!isoString) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(isoString));
  } catch {
    return "";
  }
}

/** Splits lightweight markdown ("## heading" + blank-line paragraphs) into
 * the { h } / { p } block shape the existing article renderer expects. */
function bodyToBlocks(body) {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("## ")) return { h: block.slice(3).trim() };
      return { p: block.replace(/\n/g, " ").trim() };
    });
}

/** Django BlogPostSerializer shape -> the local render shape (title/tag/
 * readTime/date/author/image/excerpt/content[]), keyed by slug. */
function normalizeApiPost(apiPost) {
  return {
    slug: apiPost.slug,
    title: apiPost.title,
    tag: apiPost.tag || "",
    readTime: estimateReadTime(apiPost.body),
    date: formatJalaliDate(apiPost.published_at),
    author: apiPost.author || "تیم نیکا",
    image: apiPost.cover_image_url || "",
    excerpt: apiPost.excerpt || "",
    content: bodyToBlocks(apiPost.body),
  };
}

/**
 * Fetches all published posts from the API. On any failure (network error,
 * unreachable backend at Cloudflare build time, etc.) falls back to the
 * local BLOG_POSTS data so the public blog is never empty/broken.
 *
 * @returns {Promise<{ posts: object, slugs: string[], source: "api"|"fallback" }>}
 */
export async function fetchBlogPosts() {
  try {
    const data = await api.get("/blog-posts/", { auth: false });
    const list = Array.isArray(data) ? data : data?.results || [];
    if (!list.length) throw new Error("empty");
    const posts = {};
    list.forEach((p) => {
      posts[p.slug] = normalizeApiPost(p);
    });
    return { posts, slugs: list.map((p) => p.slug), source: "api" };
  } catch {
    return { posts: LOCAL_BLOG_POSTS, slugs: LOCAL_BLOG_SLUGS, source: "fallback" };
  }
}

/**
 * Fetches one post by slug from the API, falling back to the local copy
 * when the API is unreachable or the post isn't found there either.
 *
 * @returns {Promise<{ post: object|null, source: "api"|"fallback" }>}
 */
export async function fetchBlogPost(slug) {
  try {
    const data = await api.get(`/blog-posts/${encodeURIComponent(slug)}/`, { auth: false });
    return { post: normalizeApiPost(data), source: "api" };
  } catch {
    return { post: LOCAL_BLOG_POSTS[slug] ? { slug, ...LOCAL_BLOG_POSTS[slug] } : null, source: "fallback" };
  }
}
