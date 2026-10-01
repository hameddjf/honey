import AdminCustomersClient from "./AdminCustomersClient";

export const metadata = {
  title: "مشتریان | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminCustomersPage() {
  return <AdminCustomersClient />;
}
