"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchAdminOrders, updateOrderStatus } from "@/lib/adminOrdersClient";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const formatToman = (n) => `${toFa(Math.round(n).toLocaleString("en-US"))} تومان`;

const STATUS_OPTIONS = [
  { value: "processing", label: "در حال پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل داده شده" },
];

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const result = await fetchAdminOrders();
      if (result.ok) setOrders(result.orders);
    })();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const changeStatus = async (orderId, status) => {
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)));
    const result = await updateOrderStatus(orderId, status);
    if (result.ok) {
      showToast("✅ وضعیت سفارش به‌روزرسانی شد");
    } else {
      showToast("❌ بروزرسانی ناموفق بود");
    }
  };

  return (
    <AdminLayout active="/nika-x7q2/orders">
      <div className="admin-head">
        <div>
          <h1>سفارش‌ها</h1>
          <p>سفارش‌های ثبت‌شده توسط مشتریان</p>
        </div>
      </div>

      <div className="admin-card">
        {orders.length === 0 ? (
          <div className="admin-empty">
            <svg className="icon"><use href="#i-box" /></svg>
            <p>هنوز هیچ سفارشی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>مشتری</th>
                  <th>تاریخ</th>
                  <th>اقلام</th>
                  <th>مبلغ کل</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b>{o.id}</b>
                    </td>
                    <td>
                      {o.customer?.name}
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }} dir="ltr">
                        {o.customer?.phone}
                      </div>
                    </td>
                    <td>{o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("fa-IR") : "")}</td>
                    <td>{toFa(o.items?.length || 0)} قلم</td>
                    <td>{formatToman(o.total || 0)}</td>
                    <td>
                      <select
                        className="admin-select"
                        value={o.status || "processing"}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </AdminLayout>
  );
}
