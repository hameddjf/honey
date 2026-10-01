import { SITE_URL } from "@/lib/seo";

// Private/system routes: never crawled. Matches the "noindex" set applied
// per-page via each route's own metadata (see those page.js files) — kept
// in sync manually since there's no single registry of routes to derive
// this from automatically.
const DISALLOW = [
  "/admin",
  "/admin/",
  "/account",
  "/account/",
  "/checkout",
  "/checkout/",
  "/invoice",
  "/invoice/",
  "/cart",
  "/login",
  "/signup",
  "/forgot-password",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
