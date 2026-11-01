import { BLOG_SLUGS, getBlogPost } from "@/lib/blog";
import BlogPostClient from "./BlogPostClient";
import { absoluteUrl, blogPostingJsonLd, breadcrumbJsonLd, jsonLdProps } from "@/lib/seo";
import { serverFetchJson } from "@/lib/serverApi";

export const revalidate = 300;

// Only the local fallback slugs are pre-generated (never touches the network at
// build time). Posts that exist only in Django render on demand (dynamicParams).
export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

// Django is the source of truth; the local copy is the offline fallback.
async function loadPost(slug) {
  const api = await serverFetchJson(`/blog-posts/${encodeURIComponent(slug)}/`);
  if (api) {
    return {
      title: api.title,
      excerpt: api.excerpt,
      image: api.cover_image_url,
      publishedAtIso: api.published_at || undefined,
      author: api.author,
    };
  }
  const local = getBlogPost(slug);
  return local
    ? { title: local.title, excerpt: local.excerpt, image: local.image, publishedAtIso: local.publishedAtIso, author: local.author }
    : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  const url = absoluteUrl(`/blog/${slug}`);
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
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  const url = absoluteUrl(`/blog/${slug}`);

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
      <BlogPostClient slug={slug} />
    </>
  );
}
