import AdminProductsClient from "./AdminProductsClient";

export const metadata = {
  title: "مدیریت محصولات | پنل نیکا",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return <AdminProductsClient />;
}
