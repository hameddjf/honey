"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, StatCard, StatusBadge, EmptyState, LoadingState, Table } from "@/components/admin/ui";
import { LineChart, DonutChart } from "@/components/admin/charts";
import { getDashboard, getReports } from "@/lib/api/adminAnalytics";
import { mapOrder } from "@/lib/api/orders";
import { api, ApiError } from "@/lib/api/client";
import { toFa } from "@/lib/adminStore";

const formatToman = (n) => `${toFa(Math.round(n || 0).toLocaleString("en-US"))} تومان`;

const STATUS_COLORS = {
  pending: "#E5A93C",
  confirmed: "#E5A93C",
  preparing: "#E5A93C",
  shipped: "#4C9FE8",
  delivered: "#3FBE7A",
  cancelled: "#E2604F",
};
const STATUS_LABELS_FA = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  preparing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
};

export default function AdminDashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [dash, reports, ordersData] = await Promise.all([
        getDashboard(),
        getReports(),
        api.get("/orders/?page_size=6"),
      ]);
      setDashboard(dash);
      setTrend(
        (reports.sales_trend || []).map((row) => ({
          label: new Date(row.date).toLocaleDateString("fa-IR"),
          value: row.revenue,
        }))
      );
      setRecentOrders((ordersData?.results || []).map((o) => mapOrder(o)));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "بارگذاری داشبورد از سرور ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const statusBreakdown = dashboard?.orders_by_status || {};
  const statusData = Object.entries(statusBreakdown)
    .filter(([status]) => status !== "cancelled")
    .map(([status, value]) => ({ label: STATUS_LABELS_FA[status] || status, value, color: STATUS_COLORS[status] || "#999" }))
    .concat([{ label: STATUS_LABELS_FA.cancelled, value: statusBreakdown.cancelled || 0, color: STATUS_COLORS.cancelled }]);

  return (
    <AdminLayout active="/admin">
      <PageHeader title="داشبورد مدیریت" desc="نمای کلی از عملکرد فروشگاه — داده‌های واقعی از سرور." />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16, color: "#B5452F" }}>
          {loadError} — <button type="button" className="a-btn" onClick={refresh}>تلاش مجدد</button>
        </div>
      )}

      {loading ? (
        <div className="a-card"><LoadingState /></div>
      ) : !dashboard ? null : (
        <>
          <div className="a-stat-grid">
            <StatCard icon="i-truck" label="تعداد سفارش‌ها" value={toFa(dashboard.totals.orders)} />
            <StatCard icon="i-credit-card" label="مجموع فروش" value={formatToman(dashboard.totals.revenue)} />
            <StatCard icon="i-users" label="مشتریان" value={toFa(dashboard.totals.customers)} />
            <StatCard
              icon="i-box"
              label="محصولات فعال"
              value={toFa(dashboard.totals.active_products)}
              sub={`از ${toFa(dashboard.totals.products)} محصول`}
            />
          </div>

          <div className="a-grid-2">
            <div className="a-card">
              <div className="a-card-head">
                <h3>
                  <svg className="icon"><use href="#i-trending-up" /></svg>
                  روند فروش
                </h3>
                <span className="a-card-head-desc">۳۰ روز اخیر</span>
              </div>
              <LineChart data={trend} />
            </div>

            <div className="a-card">
              <div className="a-card-head">
                <h3>
                  <svg className="icon"><use href="#i-truck" /></svg>
                  وضعیت سفارش‌ها
                </h3>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <DonutChart data={statusData.filter((d) => d.value > 0)} />
              </div>
              <div className="a-legend">
                {statusData.map((d) => (
                  <span className="a-legend-item" key={d.label}>
                    <span className="a-legend-dot" style={{ background: d.color }} />
                    {d.label} ({toFa(d.value)})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="a-grid-2">
            <div className="a-card">
              <div className="a-card-head">
                <h3>
                  <svg className="icon"><use href="#i-box" /></svg>
                  سفارش‌های اخیر
                </h3>
                <a className="a-card-link" href="/admin/orders" onClick={(e) => { e.preventDefault(); router.push("/admin/orders"); }}>
                  مشاهده همه
                  <svg className="icon"><use href="#i-chev-left" /></svg>
                </a>
              </div>
              {recentOrders.length === 0 ? (
                <EmptyState icon="i-box" title="هنوز سفارشی ثبت نشده" />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>سفارش</th>
                      <th>مشتری</th>
                      <th className="a-hide-mobile">تاریخ</th>
                      <th>مبلغ</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="strong">{o.id}</td>
                        <td>{o.customer?.name}</td>
                        <td className="a-hide-mobile">{o.date}</td>
                        <td>{formatToman(o.total)}</td>
                        <td><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>

            <div className="a-card">
              <div className="a-card-head">
                <h3>
                  <svg className="icon"><use href="#i-alert-triangle" /></svg>
                  هشدار موجودی کم
                </h3>
                <span className="a-card-head-desc">آستانه: {toFa(dashboard.low_stock_threshold)} عدد</span>
              </div>
              {dashboard.low_stock_products.length === 0 ? (
                <EmptyState icon="i-box" title="موجودی همه‌ی محصولات کافی است" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dashboard.low_stock_products.slice(0, 5).map((p) => (
                    <div className="a-flex-between" key={p.id} style={{ fontSize: 12.5 }}>
                      <span style={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <StatusBadge status={p.stock === 0 ? "cancelled" : "processing"} label={`${toFa(p.stock ?? 0)} عدد`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-head">
              <h3>
                <svg className="icon"><use href="#i-star" /></svg>
                پرفروش‌ترین محصولات
              </h3>
            </div>
            {dashboard.top_products.length === 0 ? (
              <EmptyState icon="i-box" title="هنوز فروشی ثبت نشده" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>تعداد فروش‌رفته</th>
                    <th className="a-hide-mobile">درآمد</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.top_products.map((p) => (
                    <tr key={p.product_name}>
                      <td className="strong">{p.product_name}</td>
                      <td>{toFa(p.quantity)} عدد</td>
                      <td className="a-hide-mobile">{formatToman(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </>
      )}

      <div className="a-card">
        <div className="a-card-head">
          <h3>
            <svg className="icon"><use href="#i-zap" /></svg>
            اقدامات سریع
          </h3>
        </div>
        <div className="a-quick-grid">
          <a className="a-quick-tile" href="/admin/products?new=1" onClick={(e) => { e.preventDefault(); router.push("/admin/products?new=1"); }}>
            <svg className="icon"><use href="#i-plus" /></svg>
            <span>افزودن محصول</span>
          </a>
          <a className="a-quick-tile" href="/admin/orders" onClick={(e) => { e.preventDefault(); router.push("/admin/orders"); }}>
            <svg className="icon"><use href="#i-truck" /></svg>
            <span>مشاهده سفارش‌ها</span>
          </a>
          <a className="a-quick-tile" href="/admin/content" onClick={(e) => { e.preventDefault(); router.push("/admin/content"); }}>
            <svg className="icon"><use href="#i-edit" /></svg>
            <span>ویرایش محتوا</span>
          </a>
          <a className="a-quick-tile" href="/admin/reports" onClick={(e) => { e.preventDefault(); router.push("/admin/reports"); }}>
            <svg className="icon"><use href="#i-trending-up" /></svg>
            <span>گزارش‌های مالی</span>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
