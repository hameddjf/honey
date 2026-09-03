import AdminUsersClient from "./AdminUsersClient";

export const metadata = {
  title: "مدیریت کاربران | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
