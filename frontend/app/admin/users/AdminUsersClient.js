"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  PageHeader,
  FilterBar,
  SearchInput,
  Table,
  StatusBadge,
  EmptyState,
  LoadingState,
  ConfirmDialog,
  useToast,
} from "@/components/admin/ui";
import { listUsers, setUserRole, deleteUser } from "@/lib/api/adminUsers";
import { getSession } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

export default function AdminUsersClient() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [me, setMe] = useState(null); // { id, email } of the signed-in staff member
  const [savingId, setSavingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const showToast = useToast();

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const items = await listUsers();
      setUsers(items);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "بارگذاری کاربران ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const session = getSession();
    setMe(session ? { id: session.id, email: session.email } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(user, role) {
    setSavingId(user.id);
    try {
      const updated = await setUserRole(user.id, role);
      setUsers((list) => list.map((u) => (u.id === user.id ? updated : u)));
      showToast("نقش کاربر به‌روزرسانی شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "به‌روزرسانی نقش ناموفق بود.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteUser(pendingDelete.id);
      setUsers((list) => list.filter((u) => u.id !== pendingDelete.id));
      showToast("کاربر حذف شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حذف کاربر ناموفق بود.", "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <AdminLayout active="/admin/users">
      <PageHeader title="کاربران و دسترسی‌ها" desc="فهرست کاربران ثبت‌شده — از بک‌اند جنگو خوانده می‌شود." />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16 }}>
          <EmptyState
            icon="i-alert"
            title="بارگذاری کاربران ناموفق بود"
            desc={loadError}
            action={
              <button type="button" className="a-btn" onClick={refresh}>
                تلاش مجدد
              </button>
            }
          />
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="جست‌وجو بر اساس نام یا ایمیل…" />
      </FilterBar>

      <div className="a-card">
        {loading ? (
          <LoadingState label="در حال بارگذاری کاربران…" />
        ) : users.length === 0 ? (
          <EmptyState icon="i-users" title="هنوز کاربری ثبت‌نام نکرده" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="i-search" title="کاربری با این مشخصات پیدا نشد" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>نام</th>
                <th>ایمیل</th>
                <th>نقش</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = !!me && u.id === me.id;
                const isSuperuser = u.role === "superuser";
                const locked = isSelf || isSuperuser;
                return (
                  <tr key={u.id}>
                    <td className="strong">{u.full_name || "—"}</td>
                    <td dir="ltr">{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <div className="a-row-actions" style={{ justifyContent: "flex-start" }}>
                        {isSuperuser ? (
                          <span className="a-muted" style={{ fontSize: 12 }}>
                            حساب مدیر ارشد — قابل تغییر نیست
                          </span>
                        ) : (
                          <>
                            <select
                              className="a-select"
                              value={u.is_staff ? "staff" : "customer"}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              disabled={isSelf || savingId === u.id}
                              title={isSelf ? "نمی‌توانید نقش خودتان را تغییر دهید" : "تغییر نقش"}
                            >
                              <option value="customer">کاربر عادی</option>
                              <option value="staff">مدیر</option>
                            </select>
                            <button
                              type="button"
                              className="danger"
                              aria-label="حذف"
                              onClick={() => setPendingDelete(u)}
                              disabled={locked}
                              title={isSelf ? "نمی‌توانید حساب خودتان را حذف کنید" : "حذف کاربر"}
                            >
                              <svg className="icon icon-sm"><use href="#i-trash" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="حذف کاربر"
        desc={pendingDelete ? `کاربر «${pendingDelete.email}» برای همیشه از سرور حذف شود؟` : ""}
        confirmLabel="حذف کاربر"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
