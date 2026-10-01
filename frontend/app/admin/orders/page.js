import AdminOrdersClient from "./AdminOrdersClient";

export const metadata = {
  title: "مدیریت سفارش‌ها | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
