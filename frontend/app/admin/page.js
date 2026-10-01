import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "پنل مدیریت",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
