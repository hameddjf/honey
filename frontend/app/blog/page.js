import BlogClient from "./BlogClient";
import { absoluteUrl } from "@/lib/seo";

export const metadata = {
  title: "وبلاگ",
  description: "مقالاتی درباره عسل طبیعی، زنبورداری و نکات تغذیه سالم.",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    type: "website",
    title: "وبلاگ عسل طبیعی نیکا",
    description: "مقالاتی درباره عسل طبیعی، زنبورداری و نکات تغذیه سالم.",
    url: absoluteUrl("/blog"),
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
