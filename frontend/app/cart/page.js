import CartClient from "./CartClient";

export const metadata = {
  title: "سبد خرید",
  description: "بررسی و ویرایش سبد خرید شما در فروشگاه عسل طبیعی نیکا.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartClient />;
}
