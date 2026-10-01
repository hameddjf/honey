"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, Field, FieldRow, StatusBadge, useToast } from "@/components/admin/ui";
import { getSession, updateProfile, changePassword } from "@/lib/auth";

export default function AdminProfileClient() {
  const [session, setSessionState] = useState(null);
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const showToast = useToast();

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setName(s?.name || "");
  }, []);

  if (!session) return null;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile(session.email, { name });
    if (!res.ok) {
      showToast(res.error, "danger");
      return;
    }
    setSessionState(res.session);
    showToast("پروفایل به‌روزرسانی شد");
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdError("");
    if (pwd.next !== pwd.confirm) {
      setPwdError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }
    const res = await changePassword(session.email, pwd.current, pwd.next);
    if (!res.ok) {
      setPwdError(res.error);
      return;
    }
    setPwd({ current: "", next: "", confirm: "" });
    showToast("رمز عبور تغییر کرد");
  };

  return (
    <AdminLayout active="/admin/profile">
      <PageHeader title="پروفایل ادمین" desc="اطلاعات حساب و امنیت — دمو، ذخیره در همین مرورگر." />

      <div className="a-card">
        <div className="a-profile-head">
          <span className="a-profile-avatar-lg">{session.name?.slice(0, 1) || "م"}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{session.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span dir="ltr" style={{ fontSize: 12.5, color: "var(--a-text-faint)" }}>{session.email}</span>
              <StatusBadge status={session.role} />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="a-card">
        <div className="a-card-head"><h3><svg className="icon"><use href="#i-user" /></svg>ویرایش اطلاعات</h3></div>
        <FieldRow>
          <Field label="نام نمایشی">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="ایمیل" hint="تغییر ایمیل در نسخه‌ی دمو پشتیبانی نمی‌شود.">
            <input dir="ltr" value={session.email} disabled />
          </Field>
        </FieldRow>
        <button type="submit" className="a-btn a-btn-gold">ذخیره‌ی تغییرات</button>
      </form>

      <form onSubmit={handlePasswordSave} className="a-card">
        <div className="a-card-head"><h3><svg className="icon"><use href="#i-lock" /></svg>تغییر رمز عبور</h3></div>
        <Field label="رمز عبور فعلی">
          <input type="password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} required />
        </Field>
        <FieldRow>
          <Field label="رمز عبور جدید">
            <input type="password" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} required />
          </Field>
          <Field label="تکرار رمز عبور جدید">
            <input type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} required />
          </Field>
        </FieldRow>
        {pwdError && <p style={{ color: "#F2A497", fontSize: 12.5, marginBottom: 12 }}>{pwdError}</p>}
        <button type="submit" className="a-btn a-btn-gold">تغییر رمز عبور</button>
      </form>
    </AdminLayout>
  );
}
