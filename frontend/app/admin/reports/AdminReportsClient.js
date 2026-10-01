"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, StatCard, EmptyState, LoadingState, Table } from "@/components/admin/ui";
import { LineChart, BarChart } from "@/components/admin/charts";
import { getReports } from "@/lib/api/adminAnalytics";
import { ApiError } from "@/lib/api/client";
import { toFa } from "@/lib/adminStore";

const formatToman = (n) => `${toFa(Math.round(n || 0).toLocaleString("en-US"))} تومان`;

const RANGE_OPTIONS = [
  { value: 7, label: "۷ روز" },
  { value: 14, label: "۱۴ روز" },
  { value: 30, label: "۳۰ روز" },
];

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function AdminReportsClient() {
  const [range, setRange] = useState(14);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = async (days) => {
    setLoading(true);
    setLoadError("");
    try {
      const to = new Date();
      const from = new Date(to.getTime() - (days - 1) * 86400000);
      const data = await getReports({ from: isoDate(from), to: isoDate(to) });
      setReport(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "بارگذاری گزارش‌ها از سرور ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const trend = (report?.sales_trend || []).map((row) => ({
    label: new Date(row.date).toLocaleDateString("fa-IR"),
    value: row.revenue,
  }));
  const byProduct = report?.sales_by_product || [];
  const deliveredRate = report ? Math.round(report.delivered_rate * 100) : 0;
  const cancelledRate = report ? Math.round(report.cancelled_rate * 100) : 0;

  return (
    <AdminLayout active="/admin/reports">
      <PageHeader
        title="گزارش‌های مالی"
        desc="خلاصه‌ی عملکرد فروش — محاسبه‌شده روی سرور از سفارش‌های واقعی."
        actions={
          <div className="a-pill-group">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`a-pill ${range === r.value ? "active" : ""}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16, color: "#B5452F" }}>
          {loadError} — <button type="button" className="a-btn" onClick={() => refresh(range)}>تلاش مجدد</button>
        </div>
      )}

      {loading ? (
        <div className="a-card"><LoadingState /></div>
      ) : !report || report.order_count === 0 ? (
        <div className="a-card">
          <EmptyState
            icon="i-trending-up"
            title="داده‌ای برای گزارش‌گیری در این بازه وجود ندارد"
            desc="بازه‌ی زمانی دیگری را انتخاب کنید یا پس از ثبت چند سفارش دوباره بررسی کنید."
          />
        </div>
      ) : (
        <>
          <div className="a-stat-grid">
            <StatCard icon="i-credit-card" label="جمع کل فروش" value={formatToman(report.total_revenue)} />
            <StatCard icon="i-box" label="تعداد سفارش‌ها" value={toFa(report.order_count)} />
            <StatCard icon="i-trending-up" label="میانگین ارزش سفارش" value={formatToman(report.average_order_value)} />
            <StatCard icon="i-truck" label="نرخ تحویل موفق" value={`${toFa(deliveredRate)}٪`} sub={`${toFa(cancelledRate)}٪ لغو شده`} />
          </div>

          <div className="a-card">
            <div className="a-card-head">
              <h3><svg className="icon"><use href="#i-trending-up" /></svg>روند درآمد</h3>
            </div>
            <LineChart data={trend} />
          </div>

          <div className="a-grid-2">
            <div className="a-card">
              <div className="a-card-head">
                <h3><svg className="icon"><use href="#i-box" /></svg>فروش به تفکیک محصول</h3>
              </div>
              <BarChart data={byProduct.slice(0, 8).map((p) => ({ label: p.product_name, value: p.quantity }))} />
            </div>

            <div className="a-card">
              <div className="a-card-head">
                <h3><svg className="icon"><use href="#i-file-text" /></svg>جدول فروش محصولات</h3>
              </div>
              <Table>
                <thead>
                  <tr><th>محصول</th><th>تعداد فروش‌رفته</th><th className="a-hide-mobile">درآمد</th></tr>
                </thead>
                <tbody>
                  {byProduct.map((p) => (
                    <tr key={p.product_name}>
                      <td className="strong">{p.product_name}</td>
                      <td>{toFa(p.quantity)}</td>
                      <td className="a-hide-mobile">{formatToman(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
