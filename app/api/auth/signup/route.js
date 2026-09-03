import { env } from "cloudflare:workers";
import { hashPassword, createSessionToken, setCustomerSessionCookie } from "@/lib/serverAuth";

export async function POST(request) {
  const { name, email, password } = await request.json().catch(() => ({}));
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!name?.trim() || !cleanEmail || !password) {
    return Response.json({ ok: false, error: "لطفاً همه‌ی فیلدها را تکمیل کنید." }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT id FROM customer_users WHERE email = ?").bind(cleanEmail).first();
  if (existing) {
    return Response.json({ ok: false, error: "این ایمیل قبلاً ثبت‌نام کرده است." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const result = await env.DB.prepare(
    "INSERT INTO customer_users (name, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'user')"
  )
    .bind(name.trim(), cleanEmail, hash, salt)
    .run();

  const id = result.meta.last_row_id;
  const token = createSessionToken(id, env);
  await setCustomerSessionCookie(token);

  return Response.json({ ok: true, session: { id, name: name.trim(), email: cleanEmail, role: "user" } });
}
