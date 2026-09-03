"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchUsers, setUserRole, deleteUserById } from "@/lib/adminUsersClient";

export default function AdminUsersClient() {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState("");

  const refresh = async () => {
    const result = await fetchUsers();
    if (result.ok) setUsers(result.users);
  };

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleRoleChange = async (id, role) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role } : u)));
    const result = await setUserRole(id, role);
    showToast(result.ok ? "✅ نقش کاربر به‌روزرسانی شد" : "❌ بروزرسانی ناموفق بود");
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`کاربر ${u.email} حذف شود؟`)) return;
    const result = await deleteUserById(u.id);
    if (!result.ok) {
      showToast("⚠️ حذف ناموفق بود");
      return;
    }
    await refresh();
    showToast("🗑️ کاربر حذف شد");
  };

  return (
    <AdminLayout active="/nika-x7q2/users">
      <div className="admin-head">
        <div>
          <h1>کاربران</h1>
          <p>حساب‌های مشتریان ثبت‌نام‌شده در فروشگاه</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>ایمیل</th>
                <th>نقش</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-faint)", padding: 24 }}>
                    هنوز هیچ مشتری‌ای ثبت‌نام نکرده است.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td dir="ltr">{u.email}</td>
                    <td>
                      <span className={`badge-role ${u.role}`}>{u.role === "admin" ? "مدیر" : "کاربر عادی"}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <select
                          className="admin-select"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="user">کاربر عادی</option>
                          <option value="admin">مدیر</option>
                        </select>
                        <button type="button" className="danger" aria-label="حذف" onClick={() => handleDelete(u)}>
                          <svg className="icon icon-sm"><use href="#i-trash" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </AdminLayout>
  );
}
