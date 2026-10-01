import AccountClient from "./AccountClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "حساب کاربری",
  description: "مشاهده سفارش‌ها، مدیریت پروفایل و آدرس‌های حساب کاربری شما در عسل طبیعی نیکا.",
};

export default function AccountPage() {
  return <AccountClient />;
}
