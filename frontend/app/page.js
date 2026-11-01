import HomeClient from "./HomeClient";
import { absoluteUrl } from "@/lib/seo";

export const metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function Page() {
  return <HomeClient />;
}
