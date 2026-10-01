import AdminContentClient from "./AdminContentClient";

export const metadata = {
  title: "محتوای سایت | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminContentPage() {
  return <AdminContentClient />;
}
