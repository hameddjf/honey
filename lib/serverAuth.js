import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "nika_admin_session";
const CUSTOMER_COOKIE = "nika_customer_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // ۱۴ روز

// ---- هش کردن پسورد (scrypt، بدون نیاز به پکیج خارجی) ----
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

// ---- امضای سشن با HMAC (بدون نیاز به کتابخانه JWT) ----
function getSecret(env) {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET تنظیم نشده. با `npx wrangler secret put ADMIN_SESSION_SECRET` یک مقدار تصادفی و طولانی ست کنید."
    );
  }
  return secret;
}

function sign(payloadB64, env) {
  return createHmac("sha256", getSecret(env)).update(payloadB64).digest("hex");
}

export function createSessionToken(adminId, env) {
  const payload = { id: adminId, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(payloadB64, env);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token, env) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = sign(payloadB64, env);
  const a = Buffer.from(sig || "", "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || null;
}

// برای استفاده در route handler ها: سشن ادمین را برمی‌گرداند یا null
export async function requireAdmin(env) {
  const token = await getSessionToken();
  const payload = verifySessionToken(token, env);
  return payload; // { id, exp } یا null
}

// ---- همان مکانیزم برای سشن مشتری (حساب کاربری سایت) ----
export async function setCustomerSessionCookie(token) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearCustomerSessionCookie() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export async function getCustomerSession(env) {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value || null;
  return verifySessionToken(token, env);
}
