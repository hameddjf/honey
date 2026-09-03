"use client";

import { useEffect, useRef, useState } from "react";
import { ICON_SPRITE, TOPBAR, HEADER, FOOTER, pageHero, commonScript } from "../_shared/chrome";
import { signup, getSession } from "@/lib/authClient";

export default function SignupClient() {
  const scriptRanRef = useRef(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (await getSession()) window.location.href = "/account";
    })();
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
    if (form.password.length < 4) {
      setError("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    setSubmitting(true);
    const result = await signup(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = "/account";
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: ICON_SPRITE + TOPBAR + HEADER }} />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "ساخت حساب کاربری",
            desc: "برای ثبت سفارش و پیگیری آن، یک حساب بسازید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/signup", label: "ثبت‌نام" },
            ],
          }),
        }}
      />

      <div className="auth-wrap">
        <div className="auth-card">
          <h1>ثبت‌نام</h1>
          <p className="auth-sub">چند قدم کوچک تا خرید عسل طبیعی</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="name">نام و نام خانوادگی</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثلاً سارا محمدی"
              />
            </div>
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
                placeholder="حداقل ۴ کاراکتر"
              />
            </div>
            <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
              <span>{submitting ? "در حال ثبت‌نام..." : "ساخت حساب"}</span>
            </button>
          </form>

          <p className="auth-switch">
            قبلاً ثبت‌نام کرده‌اید؟ <a href="/login">وارد شوید</a>
          </p>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: FOOTER }} />
    </>
  );
}
