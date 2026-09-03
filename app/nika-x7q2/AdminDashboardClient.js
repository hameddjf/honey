"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchAdminProducts } from "@/lib/adminProductsClient";
import { fetchAdminOrders } from "@/lib/adminOrdersClient";
import { fetchUsers } from "@/lib/adminUsersClient";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

export default function AdminDashboardClient() {
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchUsers(),
      ]);
      if (productsRes.ok) setProductCount(productsRes.products.length);
      if (ordersRes.ok) setOrders(ordersRes.orders);
      if (usersRes.ok) setUserCount(usersRes.users.length);
    })();
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <AdminLayout active="/nika-x7q2">
      <div className="admin-head">
        <div>
          <h1>داشبورد</h1>
          <p>نمای کلی از فروشگاه — داده‌ها به‌صورت واقعی از دیتابیس خوانده می‌شوند</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <b>{toFa(productCount)}</b>
          <span>تعداد محصولات</span>
        </div>
        <div className="admin-stat-card">
          <b>{toFa(orders.length)}</b>
          <span>سفارش ثبت‌شده</span>
        </div>
        <div className="admin-stat-card">
          <b>{formatToman(revenue)}</b>
          <span>مجموع فروش</span>
        </div>
        <div className="admin-stat-card">
          <b>{toFa(userCount)}</b>
          <span>تعداد کاربران</span>
        </div>
      </div>

      <div className="admin-card">
        <h3>راهنمای سریع</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.9, paddingBottom: 18 }}>
          از منوی کناری می‌تونی محصولات رو اضافه/ویرایش کنی، وضعیت سفارش‌ها رو تغییر بدی، محتوای صفحه‌ی
          اصلی (هیرو، ویدئو، فوتر) رو ویرایش کنی و کاربران فروشگاه رو مدیریت کنی. همه‌ی این تغییرات
          روی دیتابیس واقعی (Cloudflare D1) ذخیره می‌شن و برای همه‌ی بازدیدکننده‌های سایت اعمال می‌شن.
        </p>
      </div>
    </AdminLayout>
  );
}
