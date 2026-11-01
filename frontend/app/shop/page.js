import ShopClient from "./ShopClient";
import { absoluteUrl } from "@/lib/seo";

export const metadata = {
  title: "فروشگاه",
  description: "خرید انواع عسل طبیعی نیکا — کلزا، مرکبات، سیاه تلو، نمدار، ترنجبین، آفتابگردان و ژل رویال.",
  alternates: { canonical: absoluteUrl("/shop") },
  openGraph: {
    type: "website",
    title: "فروشگاه عسل طبیعی نیکا",
    description: "خرید انواع عسل طبیعی نیکا — کلزا، مرکبات، سیاه تلو، نمدار، ترنجبین، آفتابگردان و ژل رویال.",
    url: absoluteUrl("/shop"),
  },
};

export default function ShopPage() {
  return <ShopClient />;
}
