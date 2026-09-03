import { env } from "cloudflare:workers";
import { getCustomerSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCustomerSession(env);
  if (!session) return Response.json({ ok: false, session: null }, { status: 401 });

  const row = await env.DB.prepare("SELECT id, name, email, role FROM customer_users WHERE id = ?")
    .bind(session.id)
    .first();

  if (!row) return Response.json({ ok: false, session: null }, { status: 401 });
  return Response.json({ ok: true, session: row });
}
