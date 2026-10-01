import InvoiceClient from "./InvoiceClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "فاکتور سفارش",
  description: "فاکتور و رسید سفارش شما از فروشگاه عسل طبیعی نیکا.",
};

export default function InvoicePage() {
  return <InvoiceClient />;
}
