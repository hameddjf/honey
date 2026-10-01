"use client";

// نمودارهای سبک بدون هیچ وابستگی خارجی (SVG خالص) — چون پروژه فعلاً
// کتابخانه‌ی نموداری در package.json ندارد و افزودن یک وابستگی جدید فقط
// برای این پنل، طبق الزام پرامپت (پرهیز از وابستگی غیرضروری)، توجیهی ندارد.

import { useId, useState } from "react";

export function LineChart({ data, width = 640, height = 220, color = "var(--a-gold)" }) {
  const id = useId();
  const [hover, setHover] = useState(null);
  if (!data || data.length === 0) {
    return <div className="a-chart-empty">داده‌ای برای نمایش نیست</div>;
  }
  const pad = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((d.value - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${height - pad} L${points[0][0].toFixed(1)},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="a-linechart" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={width - pad} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} className="a-chart-grid" />
      ))}
      <path d={areaPath} fill={`url(#grad-${id})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <circle cx={x} cy={y} r={hover === i ? 5 : 3} fill={color} stroke="var(--a-card)" strokeWidth="1.5" />
          <rect x={x - stepX / 2} y={0} width={stepX || 20} height={height} fill="transparent" />
        </g>
      ))}
      {hover !== null && (
        <text x={points[hover][0]} y={Math.max(points[hover][1] - 12, 12)} textAnchor="middle" className="a-chart-tooltip">
          {data[hover].label}
        </text>
      )}
    </svg>
  );
}

export function BarChart({ data, width = 640, height = 220, color = "var(--a-gold)" }) {
  if (!data || data.length === 0) {
    return <div className="a-chart-empty">داده‌ای برای نمایش نیست</div>;
  }
  const pad = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barGap = 10;
  const barWidth = Math.max((width - pad * 2) / data.length - barGap, 8);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="a-barchart" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={width - pad} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} className="a-chart-grid" />
      ))}
      {data.map((d, i) => {
        const h = ((d.value || 0) / max) * (height - pad * 2);
        const x = pad + i * ((width - pad * 2) / data.length) + barGap / 2;
        const y = height - pad - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx={5} fill={color} opacity={0.9} />;
      })}
    </svg>
  );
}

export function DonutChart({ data, size = 160, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const cumulative = [];
  data.reduce((acc, d) => {
    cumulative.push(acc);
    return acc + d.value;
  }, 0);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="a-donutchart">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--a-border-subtle)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * circumference;
        const gap = circumference - dash;
        const rotate = (cumulative[i] / total) * 360 - 90;
        return (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rotate} ${c} ${c})`}
          />
        );
      })}
    </svg>
  );
}
