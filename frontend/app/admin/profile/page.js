import AdminProfileClient from "./AdminProfileClient";

export const metadata = {
  title: "پروفایل ادمین | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminProfilePage() {
  return <AdminProfileClient />;
}
