import { SITE_URL } from "@/lib/seo";
import { PRODUCT_SLUGS } from "@/lib/products";
import { fetchBlogPosts } from "@/lib/api/blog";

// Computed per-request (not at build time) so the blog-post list can come
// from the live Django backend without the Cloudflare build ever needing
// that backend to be reachable — fetchBlogPosts() already falls back to
// the local blog data on any failure, same as the public /blog pages.
export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.4, changeFrequency: "monthly" },
  { path: "/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/returns", priority: 0.4, changeFrequency: "monthly" },
  { path: "/buying-guide", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const productEntries = PRODUCT_SLUGS.map((slug) => ({
    url: `${SITE_URL}/product/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  let blogEntries = [];
  try {
    const { slugs } = await fetchBlogPosts();
    blogEntries = slugs.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...productEntries, ...blogEntries];
}
