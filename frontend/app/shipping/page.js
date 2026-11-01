import { absoluteUrl } from "@/lib/seo";
import ShippingClient from "./ShippingClient";

export const metadata = {
  alternates: { canonical: absoluteUrl("/shipping") },
  title: "روش‌های ارسال",
  description: "روش‌ها، زمان‌بندی و هزینه‌ی ارسال سفارش‌های عسل طبیعی نیکا در سراسر ایران.",
};

export default function ShippingPage() {
  return <ShippingClient />;
}
