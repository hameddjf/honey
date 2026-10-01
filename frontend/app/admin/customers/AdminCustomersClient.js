"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, Table, FilterBar, SearchInput, EmptyState, LoadingState, Drawer, StatusBadge } from "@/components/admin/ui";
import { formatToman, toFa } from "@/lib/adminStore";
import { listCustomers, getCustomerDetail } from "@/lib/api/adminCustomers";
import { mapOrder, STATUS_LABEL } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

export default function AdminCustomersClient() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null); // list-row customer, while detail loads
  const [detail, setDetail] = useState(null); // full detail incl. recent_orders
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers((data && data.results) || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "بارگذاری مشتریان ناموفق بود.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.phone_number || "").includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openCustomer = async (c) => {
    setActive(c);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await getCustomerDetail(c.id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const customerOrders = useMemo(() => {
    if (!detail) return [];
    return (detail.recent_orders || []).map((o) => mapOrder(o));
  }, [detail]);

  const totalSpent = useMemo(
    () => customerOrders.reduce((s, o) => s + (o.total || 0), 0),
    [customerOrders]
  );

  return (
    <AdminLayout active="/admin/customers">
      <PageHeader
        title="مشتریان"
        desc="فهرست مشتریان ثبت‌نام‌شده — از بک‌اند جنگو خوانده می‌شود."
      />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16 }}>
          <EmptyState icon="i-alert" title="بارگذاری مشتریان ناموفق بود" desc={loadError} />
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="جست‌وجو بر اساس نام، ایمیل یا شماره تماس…" />
      </FilterBar>

      <div className="a-card">
        {loading ? (
          <LoadingState label="در حال بارگذاری مشتریان…" />
        ) : customers.length === 0 ? (
          <EmptyState icon="i-users" title="هنوز مشتری‌ای ثبت‌نام نکرده" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="i-search" title="مشتری‌ای با این مشخصات پیدا نشد" />
        ) : (
          <Table clickable>
            <thead>
              <tr>
                <th>نام</th>
                <th className="a-hide-mobile">ایمیل</th>
                <th>تعداد سفارش</th>
                <th className="a-hide-mobile">تاریخ عضویت</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => openCustomer(c)}>
                  <td>
                    <b style={{ color: "#fff" }}>{c.full_name || "—"}</b>
                    <div style={{ fontSize: 11, color: "var(--a-text-faint)" }} dir="ltr">{c.phone_number}</div>
                  </td>
                  <td className="a-hide-mobile" dir="ltr">{c.email}</td>
                  <td>{toFa(c.order_count)}</td>
                  <td className="a-hide-mobile">{new Date(c.created_at).toLocaleDateString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Drawer open={!!active} onClose={() => { setActive(null); setDetail(null); }} title={active ? (active.full_name || active.email) : ""}>
        {active && (
          <>
            <div className="a-card" style={{ background: "var(--a-hover)" }}>
              <div className="a-card-head"><h3><svg className="icon"><use href="#i-user" /></svg>اطلاعات تماس</h3></div>
              <p style={{ fontSize: 12.5, color: "var(--a-text-soft)", lineHeight: 2 }}>
                <span dir="ltr">{active.email}</span><br />
                <span dir="ltr">{active.phone_number || "—"}</span>
              </p>
            </div>

            <div className="a-stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 18 }}>
              <div className="a-stat-card">
                <div className="a-stat-label">تعداد سفارش</div>
                <b style={{ fontSize: 18, color: "#fff", display: "block", marginTop: 6 }}>{toFa(active.order_count)}</b>
              </div>
              <div className="a-stat-card">
                <div className="a-stat-label">مجموع خرید (سفارش‌های اخیر)</div>
                <b style={{ fontSize: 15, color: "#fff", display: "block", marginTop: 6 }}>{formatToman(totalSpent)}</b>
              </div>
            </div>

            <div className="a-card-head"><h3><svg className="icon"><use href="#i-truck" /></svg>تاریخچه سفارش‌ها</h3></div>
            {detailLoading ? (
              <LoadingState label="در حال بارگذاری…" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {customerOrders.length === 0 && <p className="a-muted" style={{ fontSize: 12.5 }}>سفارشی ثبت نشده.</p>}
                {customerOrders.map((o) => (
                  <div className="a-flex-between" key={o.backendId} style={{ fontSize: 12.5 }}>
                    <span>
                      <div style={{ color: "#fff" }}>{String(o.id).slice(0, 8)}</div>
                      <div className="a-muted">{o.date}</div>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b>{formatToman(o.total)}</b>
                      <StatusBadge status={o.status} label={STATUS_LABEL[o.status]?.label} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
    </AdminLayout>
  );
}
