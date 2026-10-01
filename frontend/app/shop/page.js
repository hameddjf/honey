import ShopClient from "./ShopClient";
import { absoluteUrl } from "@/lib/seo";

export const metadata = {
  title: "فروشگاه",
  description: "خرید انواع عسل طبیعی نیکا — مرکبات، سیاه تلو، نمدار، خارشتر، ترنجبین و ژل رویال.",
  alternates: { canonical: absoluteUrl("/shop") },
  openGraph: {
    type: "website",
    title: "فروشگاه عسل طبیعی نیکا",
    description: "خرید انواع عسل طبیعی نیکا — مرکبات، سیاه تلو، نمدار، خارشتر، ترنجبین و ژل رویال.",
    url: absoluteUrl("/shop"),
  },
};

export default function ShopPage() {
  return <ShopClient />;
}
