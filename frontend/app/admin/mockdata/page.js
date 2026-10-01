import AdminMockDataClient from "./AdminMockDataClient";

export const metadata = {
  title: "داده‌های نمایشی | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminMockDataPage() {
  return <AdminMockDataClient />;
}
