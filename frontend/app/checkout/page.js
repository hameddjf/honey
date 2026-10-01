import CheckoutClient from "./CheckoutClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "تسویه‌حساب",
  description: "تکمیل اطلاعات ارسال و پرداخت برای ثبت سفارش عسل طبیعی نیکا.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
