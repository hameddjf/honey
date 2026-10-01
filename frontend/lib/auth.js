// لایه‌ی احراز هویت — نسخه‌ی متصل به بک‌اند جنگو (JWT).
//
// این فایل جای پیاده‌سازی قبلی (کاملاً localStorage/دمو) را می‌گیرد، اما
// همان امضای توابع را نگه می‌دارد تا کامپوننت‌های موجود بدون تغییرات گسترده
// کار کنند. توکن‌های JWT واقعی در lib/api/client.js نگه‌داری می‌شوند؛ اینجا
// فقط یک کش سبک از پروفایل کاربر (برای خوانده‌شدن هم‌زمان/sync توسط UI)
// نگه‌داری می‌شود — منبع حقیقت همیشه بک‌اند است.

import { api, setTokens, clearTokens, getRefreshToken, getAccessToken, ApiError } from "./api/client";
import {
  requestPasswordReset as apiRequestPasswordReset,
  verifyPasswordResetOtp as apiVerifyPasswordResetOtp,
  confirmPasswordReset as apiConfirmPasswordReset,
} from "./api/passwordReset";

const SESSION_CACHE_KEY = "nika_session_cache";

function userToSession(user) {
  return {
    id: user.id,
    name: user.full_name || user.email,
    email: user.email,
    phone: user.phone_number || "",
    role: user.is_staff ? "admin" : "user",
  };
}

function cacheSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {}
  return session;
}

/** Synchronous read of the last-known session (from cache). Used widely by UI guards. */
export function getSession() {
  if (typeof window === "undefined") return null;
  if (!getAccessToken()) return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Re-validates the session against the backend (GET /accounts/me/).
 * Call this from a useEffect where you can await it — it refreshes the
 * cache and clears it (logging the user out client-side) if the token is
 * no longer valid. Returns the fresh session, or null if unauthenticated.
 */
export async function refreshSession() {
  if (!getAccessToken()) return cacheSession(null);
  try {
    const user = await api.get("/accounts/me/");
    return cacheSession(userToSession(user));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearTokens();
      cacheSession(null);
    }
    return null;
  }
}

export async function signup({ name, email, password }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!name?.trim() || !cleanEmail || !password) {
    return { ok: false, error: "لطفاً همه‌ی فیلدها را تکمیل کنید." };
  }
  try {
    await api.post(
      "/accounts/register/",
      { email: cleanEmail, full_name: name.trim(), password },
      { auth: false }
    );
  } catch (err) {
    return { ok: false, error: err.message || "ثبت‌نام ناموفق بود." };
  }
  // Registration doesn't return tokens — log in immediately after.
  return login({ email: cleanEmail, password });
}

export async function login({ email, password }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { ok: false, error: "ایمیل و رمز عبور را وارد کنید." };
  }
  try {
    const tokens = await api.post(
      "/accounts/login/",
      { email: cleanEmail, password },
      { auth: false }
    );
    setTokens(tokens);
    const user = await api.get("/accounts/me/");
    const session = cacheSession(userToSession(user));
    return { ok: true, session };
  } catch (err) {
    clearTokens();
    return { ok: false, error: "ایمیل یا رمز عبور اشتباه است." };
  }
}

export async function logout() {
  const refresh = getRefreshToken();
  clearTokens();
  cacheSession(null);
  if (refresh) {
    // Best-effort: blacklist the refresh token server-side. Doesn't block
    // the (already-completed) client-side logout.
    try {
      await api.post("/accounts/logout/", { refresh });
    } catch {}
  }
}

export function isAdmin(session) {
  return !!session && session.role === "admin";
}

export async function updateProfile(_email, patch) {
  try {
    const user = await api.patch("/accounts/me/", {
      full_name: patch.name,
      phone_number: patch.phone,
    });
    const session = cacheSession(userToSession(user));
    return { ok: true, session };
  } catch (err) {
    return { ok: false, error: err.message || "به‌روزرسانی پروفایل ناموفق بود." };
  }
}

export async function changePassword(_email, currentPassword, newPassword) {
  try {
    await api.post("/accounts/me/change-password/", {
      old_password: currentPassword,
      new_password: newPassword,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "تغییر رمز عبور ناموفق بود." };
  }
}

export async function requestPasswordReset(email) {
  try {
    const data = await apiRequestPasswordReset((email || "").trim().toLowerCase());
    return { ok: true, message: data?.detail };
  } catch (err) {
    return { ok: false, error: err.message || "درخواست بازیابی رمز عبور ناموفق بود.", status: err.status };
  }
}

export async function verifyPasswordResetOtp(email, code) {
  try {
    const data = await apiVerifyPasswordResetOtp((email || "").trim().toLowerCase(), code);
    return { ok: true, resetToken: data.reset_token, expiresInMinutes: data.expires_in_minutes };
  } catch (err) {
    return { ok: false, error: err.message || "کد وارد شده نامعتبر است.", status: err.status };
  }
}

export async function confirmPasswordReset(resetToken, newPassword) {
  try {
    const data = await apiConfirmPasswordReset(resetToken, newPassword);
    return { ok: true, message: data?.detail };
  } catch (err) {
    return { ok: false, error: err.message || "تغییر رمز عبور ناموفق بود.", status: err.status };
  }
}

