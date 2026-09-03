// لایه‌ی کلاینت برای احراز هویت پنل ادمین (موبایل + رمز عبور) — جدا از حساب مشتری‌ها.

export async function adminLogin({ mobile, password }) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mobile, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, error: data.error || "ورود ناموفق بود." };
  return { ok: true, admin: data.admin };
}

export async function adminLogout() {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
}

export async function getAdminSession() {
  try {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.admin || null;
  } catch {
    return null;
  }
}
