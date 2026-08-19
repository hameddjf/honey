import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "فروشگاه | عسل‌ستان",
  description: "همهٔ محصولات عسل طبیعی عسل‌ستان — تک‌گل، چندگل و موم‌دار.",
};

export default function ShopPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 90 }}>
        <ShopClient />
      </main>
      <Footer />
    </>
  );
}
