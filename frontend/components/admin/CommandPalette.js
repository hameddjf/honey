"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flattenNav, getQuickActions } from "./nav";

export default function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nav = flattenNav().map((item) => ({ ...item, kind: "nav" }));
    const actions = getQuickActions().map((item) => ({ ...item, kind: "action" }));
    const all = [...nav, ...actions];
    if (!q) return all;
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) onNavigate?.(item.href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, onClose, onNavigate]);

  if (!open) return null;

  const navResults = results.filter((r) => r.kind === "nav");
  const actionResults = results.filter((r) => r.kind === "action");

  let runningIndex = -1;

  return (
    <div className="a-cmdk-overlay" onClick={onClose}>
      <div className="a-cmdk" role="dialog" aria-modal="true" aria-label="پالت فرمان" onClick={(e) => e.stopPropagation()}>
        <div className="a-cmdk-input-row">
          <svg className="icon"><use href="#i-search" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی صفحه یا اقدام سریع…"
          />
          <span className="a-cmdk-esc">Esc</span>
        </div>
        <div className="a-cmdk-list">
          {results.length === 0 && <div className="a-cmdk-empty">چیزی پیدا نشد</div>}

          {navResults.length > 0 && (
            <>
              <div className="a-cmdk-group-label">صفحات</div>
              {navResults.map((item) => {
                runningIndex += 1;
                const idx = runningIndex;
                return (
                  <button
                    key={item.href}
                    type="button"
                    className={`a-cmdk-item ${idx === activeIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => onNavigate?.(item.href)}
                  >
                    <svg className="icon"><use href={`#${item.icon}`} /></svg>
                    {item.label}
                  </button>
                );
              })}
            </>
          )}

          {actionResults.length > 0 && (
            <>
              <div className="a-cmdk-group-label">اقدامات سریع</div>
              {actionResults.map((item) => {
                runningIndex += 1;
                const idx = runningIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`a-cmdk-item ${idx === activeIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => onNavigate?.(item.href)}
                  >
                    <svg className="icon"><use href={`#${item.icon}`} /></svg>
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
