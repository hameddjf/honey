import { absoluteUrl } from "@/lib/seo";
import ReturnsClient from "./ReturnsClient";

export const metadata = {
  alternates: { canonical: absoluteUrl("/returns") },
  title: "شرایط بازگشت کالا",
  description: "شرایط و مراحل بازگشت یا تعویض کالا در فروشگاه عسل طبیعی نیکا.",
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}
