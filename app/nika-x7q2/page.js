import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "پنل مدیریت | عسل طبیعی نیکا",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
