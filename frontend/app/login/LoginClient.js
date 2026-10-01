"use client";

import { useEffect, useRef, useState } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";
import { login, getSession } from "@/lib/auth";

function getNextParam() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("next") || "";
}

export default function LoginClient() {
  const scriptRanRef = useRef(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // اگر از قبل واردیم، مستقیم بفرست همون‌جایی که باید بره
    const session = getSession();
    if (session) {
      window.location.href = getNextParam() || (session.role === "admin" ? "/admin" : "/account");
    }
  }, []);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    return () => script.remove();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = getNextParam() || (result.session.role === "admin" ? "/admin" : "/account");
    window.location.href = next;
  };

  return (
    <>
      <PublicTopbarHeader />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "ورود به حساب کاربری",
            desc: "برای مشاهده سفارش‌ها و مدیریت حساب خود وارد شوید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/login", label: "ورود" },
            ],
          }),
        }}
      />

      <div className="auth-wrap">
        <div className="auth-card">
          <h1>خوش آمدید</h1>
          <p className="auth-sub">برای ادامه، ایمیل و رمز عبور خود را وارد کنید</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">ایمیل</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
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
            <p style={{ textAlign: "end", marginBottom: 18 }}>
              <a href="/forgot-password" className="btn-link-full">رمز عبور را فراموش کرده‌اید؟</a>
            </p>
            <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
              <span>{submitting ? "در حال ورود..." : "ورود"}</span>
            </button>
          </form>

          <p className="auth-switch">
            حساب ندارید؟ <a href="/signup">ثبت‌نام کنید</a>
          </p>

          <div className="auth-hint">
            برای ورود به پنل مدیریت با داده‌ی دمو: <br />
            ایمیل: <b dir="ltr">staff@nikahoney.local</b> — رمز: <b dir="ltr">staff-pass-123</b>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
