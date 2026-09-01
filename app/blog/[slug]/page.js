import { notFound } from "next/navigation";
import { BLOG_SLUGS, getBlogPost } from "@/lib/blog";
import BlogPostClient from "./BlogPostClient";

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | وبلاگ نیکا`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();
  return <BlogPostClient slug={params.slug} />;
}
