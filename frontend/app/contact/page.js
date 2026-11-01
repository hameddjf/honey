import { absoluteUrl } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const metadata = {
  alternates: { canonical: absoluteUrl("/contact") },
  title: "تماس با ما",
  description: "راه‌های تماس با تیم پشتیبانی نیکا و فرم ارسال پیام.",
};

export default function ContactPage() {
  return <ContactClient />;
}
