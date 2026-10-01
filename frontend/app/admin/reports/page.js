import AdminReportsClient from "./AdminReportsClient";

export const metadata = {
  title: "گزارش‌های مالی | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
