"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* ============================== Toast ============================== */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, tone = "success") => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="a-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast a-toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // خارج از AdminShell استفاده نشود، اما برای ایمنی یک نسخه‌ی بی‌اثر برمی‌گردانیم
    return () => {};
  }
  return ctx;
}

/* ============================== StatCard ============================== */

export function StatCard({ icon, label, value, sub, trend }) {
  return (
    <div className="a-stat-card">
      <div className="a-stat-top">
        <span className="a-stat-label">{label}</span>
        {icon && (
          <span className="a-stat-icon">
            <svg className="icon icon-sm"><use href={`#${icon}`} /></svg>
          </span>
        )}
      </div>
      <div className="a-stat-bottom">
        <b>{value}</b>
        {trend && (
          <span className={`a-trend ${trend.direction === "down" ? "down" : "up"}`}>
            <svg className="icon icon-xs"><use href={`#i-arrow-${trend.direction === "down" ? "down" : "up"}`} /></svg>
            {trend.label}
          </span>
        )}
      </div>
      {sub && <div className="a-stat-sub">{sub}</div>}
    </div>
  );
}

/* ============================== StatusBadge ============================== */

const STATUS_MAP = {
  processing: { label: "در حال پردازش", tone: "gold" },
  shipped: { label: "ارسال شده", tone: "blue" },
  delivered: { label: "تحویل داده شده", tone: "green" },
  cancelled: { label: "لغو شده", tone: "red" },
  active: { label: "فعال", tone: "green" },
  draft: { label: "پیش‌نویس", tone: "faint" },
  admin: { label: "مدیر", tone: "gold" },
  user: { label: "کاربر عادی", tone: "faint" },
  superuser: { label: "مدیر ارشد", tone: "gold" },
  staff: { label: "مدیر", tone: "gold" },
  customer: { label: "کاربر عادی", tone: "faint" },
};

export function StatusBadge({ status, label }) {
  const meta = STATUS_MAP[status] || { label: label || status, tone: "faint" };
  return <span className={`a-badge a-badge-${meta.tone}`}>{label || meta.label}</span>;
}

/* ============================== EmptyState / LoadingState ============================== */

export function EmptyState({ icon = "i-box", title, desc, action }) {
  return (
    <div className="a-empty">
      <svg className="icon"><use href={`#${icon}`} /></svg>
      <p className="a-empty-title">{title}</p>
      {desc && <p className="a-empty-desc">{desc}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "در حال بارگذاری…" }) {
  return (
    <div className="a-loading">
      <span className="a-spinner" />
      <span>{label}</span>
    </div>
  );
}

/* ============================== ConfirmDialog ============================== */

export function ConfirmDialog({ open, title, desc, confirmLabel = "تأیید", danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="a-modal-overlay" onClick={onCancel}>
      <div className="a-modal a-modal-sm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {desc && <p className="a-modal-desc">{desc}</p>}
        <div className="a-modal-actions">
          <button type="button" className="a-btn a-btn-ghost" onClick={onCancel}>
            انصراف
          </button>
          <button type="button" className={danger ? "a-btn a-btn-danger" : "a-btn a-btn-gold"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Modal ============================== */

export function Modal({ open, onClose, title, children, width = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div className={`a-modal a-modal-${width}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="a-modal-head">
          <h3>{title}</h3>
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="بستن">
            <svg className="icon icon-sm"><use href="#i-close" /></svg>
          </button>
        </div>
        <div className="a-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ============================== Drawer ============================== */

export function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`a-drawer-overlay ${open ? "active" : ""}`} onClick={onClose} aria-hidden={!open}>
      <div className="a-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="a-drawer-head">
          <h3>{title}</h3>
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="بستن">
            <svg className="icon icon-sm"><use href="#i-close" /></svg>
          </button>
        </div>
        <div className="a-drawer-body">{children}</div>
        {footer && <div className="a-drawer-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ============================== FilterBar ============================== */

export function FilterBar({ children }) {
  return <div className="a-filterbar">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder = "جست‌وجو…" }) {
  return (
    <div className="a-search-input">
      <svg className="icon icon-sm"><use href="#i-search" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/* ============================== PageHeader ============================== */

export function PageHeader({ title, desc, actions }) {
  return (
    <div className="a-page-head">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </div>
  );
}

/* ============================== DemoNote ============================== */

export function DemoNote({ children }) {
  return (
    <div className="a-demo-note">
      <svg className="icon icon-sm"><use href="#i-alert-triangle" /></svg>
      <p>{children}</p>
    </div>
  );
}

/* ============================== Table ============================== */

export function Table({ children, clickable }) {
  return (
    <div className="a-table-wrap">
      <table className={`a-table ${clickable ? "a-table-clickable" : ""}`}>{children}</table>
    </div>
  );
}

/* ============================== Field / FieldRow / Switch ============================== */

export function FieldRow({ children }) {
  return <div className="a-form-row">{children}</div>;
}

export function Field({ label, hint, children }) {
  return (
    <div className="a-field">
      {label && <label>{label}</label>}
      {children}
      {hint && <div className="a-field-hint">{hint}</div>}
    </div>
  );
}

export function SwitchRow({ label, desc, checked, onChange }) {
  return (
    <div className="a-switch-row">
      <div>
        <div className="a-switch-label">{label}</div>
        {desc && <div className="a-switch-desc">{desc}</div>}
      </div>
      <span className="a-switch">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="a-switch-dot" />
      </span>
    </div>
  );
}

/* ============================== IconButton ============================== */

export function IconButton({ icon, label, danger, onClick, type = "button" }) {
  return (
    <button type={type} className={danger ? "danger" : ""} aria-label={label} title={label} onClick={onClick}>
      <svg className="icon icon-sm"><use href={`#${icon}`} /></svg>
    </button>
  );
}
