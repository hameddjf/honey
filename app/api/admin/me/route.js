import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, admin: null }, { status: 401 });

  const row = await env.DB.prepare("SELECT id, name, mobile FROM admin_users WHERE id = ?")
    .bind(session.id)
    .first();

  if (!row) return Response.json({ ok: false, admin: null }, { status: 401 });
  return Response.json({ ok: true, admin: row });
}
