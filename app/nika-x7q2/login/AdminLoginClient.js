"use client";

import { useEffect, useState } from "react";
import { ICON_SPRITE } from "../../_shared/chrome";
import { adminLogin, getAdminSession } from "@/lib/adminAuthClient";

function getNextParam() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("next") || "/nika-x7q2";
}

export default function AdminLoginClient() {
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const admin = await getAdminSession();
      if (admin) window.location.href = getNextParam();
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await adminLogin(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = getNextParam();
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
      <div className="auth-wrap" style={{ minHeight: "100vh", alignItems: "center", display: "flex" }}>
        <div className="auth-card">
          <h1>ورود به پنل مدیریت</h1>
          <p className="auth-sub">شماره موبایل و رمز عبور مدیر را وارد کنید</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="mobile">شماره موبایل</label>
              <input
                id="mobile"
                type="tel"
                dir="ltr"
                required
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">رمز عبور</label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
              <span>{submitting ? "در حال ورود..." : "ورود"}</span>
            </button>
          </form>

          <p className="auth-switch">
            <a href="/">بازگشت به سایت</a>
          </p>
        </div>
      </div>
    </>
  );
}
