import { absoluteUrl } from "@/lib/seo";
import FaqClient from "./FaqClient";

export const metadata = {
  alternates: { canonical: absoluteUrl("/faq") },
  title: "سوالات متداول",
  description: "پاسخ پرتکرارترین سوالات درباره محصولات، ارسال و خرید از عسل طبیعی نیکا.",
};

export default function FaqPage() {
  return <FaqClient />;
}
