import { BLOG_SLUGS, getBlogPost } from "@/lib/blog";
import BlogPostClient from "./BlogPostClient";
import { absoluteUrl, blogPostingJsonLd, breadcrumbJsonLd, jsonLdProps } from "@/lib/seo";

// Pre-generates routes for the local fallback slugs only — this never
// touches the network, so the Cloudflare build never depends on the
// Django backend being reachable. Any slug that only exists in the
// backend (added after this build) still renders fine: it's handled at
// request time by BlogPostClient's client-side fetch, since dynamicParams
// isn't disabled here.
export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

// Best-effort metadata from the local copy when the slug is one of the
// known local posts (this runs at BUILD time for statically-generated
// slugs, so it must stay backend-independent); falls back to a generic
// title otherwise. The real title/content still render once
// BlogPostClient's client-side fetch resolves against the live backend.
export function generateMetadata({ params }) {
  const post = getBlogPost(params.slug);
  const url = absoluteUrl(`/blog/${params.slug}`);
  if (!post) {
    return {
      title: "وبلاگ",
      description: "مقالاتی درباره عسل طبیعی، زنبورداری و نکات تغذیه سالم.",
      alternates: { canonical: url },
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      images: post.image ? [{ url: absoluteUrl(post.image) }] : undefined,
      publishedTime: post.publishedAtIso,
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default function BlogPostPage({ params }) {
  const post = getBlogPost(params.slug);
  const url = absoluteUrl(`/blog/${params.slug}`);

  return (
    <>
      {post && (
        <>
          <script
            {...jsonLdProps(
              blogPostingJsonLd({
                title: post.title,
                description: post.excerpt,
                image: post.image ? absoluteUrl(post.image) : undefined,
                url,
                datePublished: post.publishedAtIso,
                author: post.author,
              })
            )}
          />
          <script
            {...jsonLdProps(
              breadcrumbJsonLd([
                { label: "خانه", href: "/" },
                { label: "وبلاگ", href: "/blog" },
                { label: post.title },
              ])
            )}
          />
        </>
      )}
      <BlogPostClient slug={params.slug} />
    </>
  );
}
