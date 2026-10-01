import AdminSettingsClient from "./AdminSettingsClient";

export const metadata = {
  title: "تنظیمات عمومی | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
