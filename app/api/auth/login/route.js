import { env } from "cloudflare:workers";
import { verifyPassword, createSessionToken, setCustomerSessionCookie } from "@/lib/serverAuth";

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  const cleanEmail = (email || "").trim().toLowerCase();

  const row = await env.DB.prepare("SELECT * FROM customer_users WHERE email = ?").bind(cleanEmail).first();
  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    return Response.json({ ok: false, error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  const token = createSessionToken(row.id, env);
  await setCustomerSessionCookie(token);

  return Response.json({ ok: true, session: { id: row.id, name: row.name, email: row.email, role: row.role } });
}
