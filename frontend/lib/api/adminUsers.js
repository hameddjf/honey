// لایه‌ی مدیریت کاربران برای پنل ادمین — متصل به /api/v1/admin/users/.
//
// جای lib/authDemoOnly.js (کاملاً localStorage/دمو) را برای صفحه‌ی
// /admin/users می‌گیرد. فقط دو نوع تغییر پشتیبانی می‌شود — همان چیزی که
// بک‌اند اجازه می‌دهد: تغییر نقش (customer/staff) و حذف کاربر. ارتقا به
// «superuser» یا ساخت کاربر جدید از این مسیر ممکن نیست (نه در UI، نه در
// API) — این یک تصمیم امنیتی سمت سرور است، نه محدودیت این فایل.

import { api } from "./client";

export async function listUsers() {
  const data = await api.get("/admin/users/?page_size=200", { auth: true });
  return (data && data.results) || [];
}

/** role: "customer" | "staff" — هرگز "superuser" (سمت سرور رد می‌شود). */
export function setUserRole(id, role) {
  return api.patch(`/admin/users/${encodeURIComponent(id)}/`, { role }, { auth: true });
}

export function deleteUser(id) {
  return api.delete(`/admin/users/${encodeURIComponent(id)}/`, { auth: true });
}
