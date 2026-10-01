"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  PageHeader,
  Table,
  StatusBadge,
  EmptyState,
  LoadingState,
  FilterBar,
  SearchInput,
  Drawer,
  useToast,
} from "@/components/admin/ui";
import { formatToman, toFa } from "@/lib/adminStore";
import { STATUS_LABEL, mapOrder } from "@/lib/api/orders";
import { api, ApiError } from "@/lib/api/client";

const STATUS_OPTIONS = [
  { value: "all", label: "همه‌ی وضعیت‌ها" },
  ...Object.entries(STATUS_LABEL).map(([value, meta]) => ({ value, label: meta.label })),
];

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const showToast = useToast();

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.get("/orders/?page_size=100");
      setOrders((data?.results || []).map((o) => mapOrder(o)));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "بارگذاری سفارش‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...orders]
      .filter((o) => {
        const matchesQuery =
          !q ||
          String(o.id).toLowerCase().includes(q) ||
          (o.customer?.name || "").toLowerCase().includes(q) ||
          (o.customer?.phone || "").includes(q);
        const matchesStatus = status === "all" || o.status === status;
        return matchesQuery && matchesStatus;
      });
  }, [orders, search, status]);

  const changeStatus = async (order, newStatus) => {
    setChangingStatus(true);
    try {
      const updated = await api.patch(`/orders/${order.backendId}/status/`, { status: newStatus });
      const mapped = mapOrder(updated, order.customer);
      setOrders((list) => list.map((o) => (o.backendId === order.backendId ? mapped : o)));
      setActiveOrder(mapped);
      showToast("وضعیت سفارش به‌روزرسانی شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "تغییر وضعیت ناموفق بود.");
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <AdminLayout active="/admin/orders">
      <PageHeader
        title="سفارش‌ها"
        desc="سفارش‌های ثبت‌شده — از بک‌اند جنگو خوانده می‌شود."
      />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16 }}>
          <EmptyState icon="i-alert" title="بارگذاری سفارش‌ها ناموفق بود" desc={loadError} />
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="جست‌وجو بر اساس شماره سفارش، نام یا شماره تماس…" />
        <select className="a-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </FilterBar>

      <div className="a-card">
        {loading ? (
          <LoadingState label="در حال بارگذاری سفارش‌ها…" />
        ) : orders.length === 0 ? (
          <EmptyState icon="i-box" title="هنوز هیچ سفارشی ثبت نشده است" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="i-search" title="سفارشی با این مشخصات پیدا نشد" />
        ) : (
          <Table clickable>
            <thead>
              <tr>
                <th>شماره سفارش</th>
                <th>مشتری</th>
                <th className="a-hide-mobile">تاریخ</th>
                <th className="a-hide-mobile">اقلام</th>
                <th>مبلغ کل</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.backendId} onClick={() => setActiveOrder(o)}>
                  <td className="strong">{String(o.id).slice(0, 8)}</td>
                  <td>
                    {o.customer?.name}
                    <div style={{ fontSize: 11, color: "var(--a-text-faint)" }} dir="ltr">{o.customer?.phone}</div>
                  </td>
                  <td className="a-hide-mobile">{o.date}</td>
                  <td className="a-hide-mobile">{toFa(o.items?.length || 0)} قلم</td>
                  <td>{formatToman(o.total || 0)}</td>
                  <td><StatusBadge status={o.status} label={STATUS_LABEL[o.status]?.label} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Drawer open={!!activeOrder} onClose={() => setActiveOrder(null)} title={activeOrder ? `سفارش ${String(activeOrder.id).slice(0, 8)}` : ""}>
        {activeOrder && (
          <>
            <div className="a-field">
              <label>وضعیت سفارش</label>
              <select
                className="a-select"
                style={{ width: "100%" }}
                value={activeOrder.status}
                disabled={changingStatus}
                onChange={(e) => changeStatus(activeOrder, e.target.value)}
              >
                {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="a-card" style={{ background: "var(--a-hover)" }}>
              <div className="a-card-head"><h3><svg className="icon"><use href="#i-user" /></svg>مشتری</h3></div>
              <p style={{ fontSize: 12.5, color: "var(--a-text-soft)", lineHeight: 2 }}>
                {activeOrder.customer?.name}<br />
                <span dir="ltr">{activeOrder.customer?.phone}</span><br />
                {activeOrder.customer?.address}
              </p>
            </div>

            <div className="a-card" style={{ background: "var(--a-hover)" }}>
              <div className="a-card-head">
                <h3><svg className="icon"><use href="#i-credit-card" /></svg>پرداخت</h3>
                <span className="a-badge a-badge-faint">{activeOrder.payment}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--a-text-faint)" }}>تاریخ ثبت: {activeOrder.date} — {activeOrder.time}</p>
            </div>

            <div className="a-card-head" style={{ marginTop: 4 }}>
              <h3><svg className="icon"><use href="#i-box" /></svg>اقلام سفارش</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {(activeOrder.items || []).map((it, idx) => (
                <div className="a-flex-between" key={idx} style={{ fontSize: 12.5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span>
                      <div style={{ color: "#fff" }}>{it.title}</div>
                      <div className="a-muted">{toFa(it.qty)} × {formatToman(it.price)}</div>
                    </span>
                  </span>
                  <b style={{ color: "#fff" }}>{formatToman(it.lineTotal)}</b>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--a-border-subtle)", paddingTop: 12, fontSize: 12.5 }}>
              <div className="a-flex-between" style={{ marginBottom: 6 }}><span className="a-muted">جمع اقلام</span><span>{formatToman(activeOrder.subtotal)}</span></div>
              <div className="a-flex-between" style={{ marginBottom: 6 }}>
                <span className="a-muted">هزینه ارسال</span>
                <span>{activeOrder.shipping ? formatToman(activeOrder.shipping) : "رایگان"}</span>
              </div>
              <div className="a-flex-between" style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                <span>مبلغ کل</span><span>{formatToman(activeOrder.total)}</span>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </AdminLayout>
  );
}
