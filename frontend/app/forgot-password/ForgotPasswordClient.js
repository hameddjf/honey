"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pageHero, commonScript } from "../_shared/chrome";
import { PublicTopbarHeader, PublicFooter } from "../_shared/SiteChrome";
import { requestPasswordReset, verifyPasswordResetOtp, confirmPasswordReset } from "@/lib/auth";

const RESEND_COOLDOWN_SECONDS = 60; // mirrors PASSWORD_RESET_RESEND_COOLDOWN_SECONDS on the backend

function passwordIssue(pw) {
  if (!pw || pw.length < 8) return "رمز عبور باید حداقل ۸ کاراکتر باشد.";
  return "";
}

export default function ForgotPasswordClient() {
  const scriptRanRef = useRef(false);
  const [step, setStep] = useState("email"); // email | otp | reset | done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = commonScript();
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    return () => script.remove();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendOtp = async (targetEmail) => {
    const result = await requestPasswordReset(targetEmail);
    if (!result.ok) {
      // Network/5xx/429 — the request itself failed to reach the server,
      // as opposed to "email not found" (which the backend never reveals).
      if (result.status === 429) {
        setError("تعداد درخواست‌های شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.");
      } else if (!result.status) {
        setError("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.");
      } else {
        setError(result.error || "ارسال کد ناموفق بود.");
      }
      return false;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const sent = await sendOtp(email.trim().toLowerCase());
    setSubmitting(false);
    if (!sent) return;
    setStep("otp");
  };

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    setError("");
    setSubmitting(true);
    await sendOtp(email.trim().toLowerCase());
    setSubmitting(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError("کد تأیید را کامل و بدون فاصله وارد کنید.");
      return;
    }
    setSubmitting(true);
    const result = await verifyPasswordResetOtp(email.trim().toLowerCase(), code.trim());
    setSubmitting(false);
    if (!result.ok) {
      if (result.status === 429) {
        setError("تعداد تلاش‌های شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.");
      } else if (!result.status) {
        setError("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.");
      } else {
        setError(result.error); // "کد نامعتبر/منقضی" یا "تعداد تلاش‌ها تمام شد" — از سرور می‌آید
      }
      return;
    }
    setResetToken(result.resetToken);
    setStep("reset");
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const issue = passwordIssue(passwords.next);
    if (issue) {
      setError(issue);
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }
    setSubmitting(true);
    const result = await confirmPasswordReset(resetToken, passwords.next);
    setSubmitting(false);
    if (!result.ok) {
      if (!result.status) {
        setError("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.");
      } else if (result.status === 400) {
        // Reset authorization expired/invalid — the OTP step must be redone.
        setError("زمان این مرحله به پایان رسیده. لطفاً دوباره از ابتدا شروع کنید.");
      } else {
        setError(result.error);
      }
      return;
    }
    setStep("done");
  };

  const cooldownLabel = useMemo(() => {
    if (cooldown <= 0) return null;
    const m = Math.floor(cooldown / 60);
    const s = cooldown % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s} ثانیه`;
  }, [cooldown]);

  return (
    <>
      <PublicTopbarHeader />
      <div
        dangerouslySetInnerHTML={{
          __html: pageHero({
            title: "فراموشی رمز عبور",
            desc: "برای بازیابی دسترسی به حساب کاربری خود، مراحل زیر را دنبال کنید",
            crumbs: [
              { href: "/", label: "خانه" },
              { href: "/login", label: "ورود" },
              { href: "/forgot-password", label: "فراموشی رمز عبور" },
            ],
          }),
        }}
      />

      <div className="auth-wrap">
        <div className="auth-card">
          {step === "email" && (
            <>
              <h1>بازیابی رمز عبور</h1>
              <p className="auth-sub">ایمیل خود را وارد کنید تا کد تأیید برایتان ارسال شود</p>

              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleEmailSubmit}>
                <div className="form-field">
                  <label htmlFor="fp-email">ایمیل</label>
                  <input
                    id="fp-email"
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
                  <span>{submitting ? "در حال ارسال..." : "ارسال کد تأیید"}</span>
                </button>
              </form>

              <p className="auth-switch">
                رمز عبور را به‌خاطر آوردید؟ <a href="/login">ورود به حساب</a>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <h1>کد تأیید را وارد کنید</h1>
              <p className="auth-sub">
                کدی ۶ رقمی به ایمیل <span dir="ltr">{email}</span> ارسال شد
              </p>

              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleOtpSubmit}>
                <div className="form-field">
                  <label htmlFor="fp-code">کد تأیید</label>
                  <input
                    id="fp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    dir="ltr"
                    style={{ letterSpacing: "6px", fontSize: 20, textAlign: "center" }}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="------"
                    maxLength={8}
                  />
                </div>
                <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
                  <span>{submitting ? "در حال بررسی..." : "تأیید کد"}</span>
                </button>
              </form>

              <p className="auth-switch">
                {cooldownLabel ? (
                  <>ارسال دوباره‌ی کد تا {cooldownLabel} دیگر</>
                ) : (
                  <button type="button" className="auth-link-btn" onClick={handleResend} disabled={submitting}>
                    ارسال دوباره‌ی کد
                  </button>
                )}
              </p>
              <p className="auth-switch">
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                >
                  تغییر ایمیل
                </button>
              </p>
            </>
          )}

          {step === "reset" && (
            <>
              <h1>تعیین رمز عبور جدید</h1>
              <p className="auth-sub" dir="ltr">{email}</p>

              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleResetSubmit}>
                <div className="form-field">
                  <label htmlFor="fp-next">رمز عبور جدید</label>
                  <input
                    id="fp-next"
                    type="password"
                    required
                    value={passwords.next}
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="fp-confirm">تکرار رمز عبور جدید</label>
                  <input
                    id="fp-confirm"
                    type="password"
                    required
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="btn btn-gold auth-submit" disabled={submitting}>
                  <span>{submitting ? "در حال ذخیره..." : "تغییر رمز عبور"}</span>
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <>
              <h1>رمز عبور تغییر کرد</h1>
              <p className="auth-success">رمز عبور جدید شما با موفقیت ذخیره شد. اکنون می‌توانید با آن وارد شوید.</p>
              <a href="/login" className="btn btn-gold auth-submit" style={{ display: "flex" }}>
                <span>ورود به حساب</span>
              </a>
            </>
          )}
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
