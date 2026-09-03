// لایه‌ی کلاینت برای حساب کاربری مشتری‌ها (فروشگاه) — از طریق API واقعی روی D1.
// نکته: getSession دیگه synchronous نیست، باید await بشه.

async function callApi(url, options) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok, ...data };
}

export async function signup({ name, email, password }) {
  const result = await callApi("/api/auth/signup", { body: JSON.stringify({ name, email, password }) });
  if (!result.ok) return { ok: false, error: result.error || "ثبت‌نام ناموفق بود." };
  return { ok: true, session: result.session };
}

export async function login({ email, password }) {
  const result = await callApi("/api/auth/login", { body: JSON.stringify({ email, password }) });
  if (!result.ok) return { ok: false, error: result.error || "ورود ناموفق بود." };
  return { ok: true, session: result.session };
}

export async function logout() {
  await callApi("/api/auth/logout", { body: "{}" });
}

export async function getSession() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session || null;
  } catch {
    return null;
  }
}
