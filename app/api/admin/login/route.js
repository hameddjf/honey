import { env } from "cloudflare:workers";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/serverAuth";

export async function POST(request) {
  const { mobile, password } = await request.json().catch(() => ({}));

  if (!mobile || !password) {
    return Response.json({ ok: false, error: "شماره موبایل و رمز عبور را وارد کنید." }, { status: 400 });
  }

  const cleanMobile = String(mobile).trim();
  const row = await env.DB.prepare("SELECT * FROM admin_users WHERE mobile = ?")
    .bind(cleanMobile)
    .first();

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    return Response.json({ ok: false, error: "شماره موبایل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  const token = createSessionToken(row.id, env);
  await setSessionCookie(token);

  return Response.json({ ok: true, admin: { id: row.id, name: row.name, mobile: row.mobile } });
}
