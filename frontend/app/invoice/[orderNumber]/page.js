import InvoiceDetailClient from "./InvoiceDetailClient";

export const metadata = {
  title: "فاکتور سفارش",
  description: "فاکتور و رسید سفارش شما از فروشگاه عسل طبیعی نیکا.",
  robots: { index: false, follow: false },
};

export default async function InvoiceDetailPage({ params }) {
  const { orderNumber } = await params;
  return <InvoiceDetailClient orderNumber={orderNumber} />;
}
