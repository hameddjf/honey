import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT id, name, email, role, created_at FROM customer_users ORDER BY created_at DESC"
  ).all();
  return Response.json({ ok: true, users: results });
}
