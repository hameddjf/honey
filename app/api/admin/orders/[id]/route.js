import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";

const VALID_STATUSES = new Set(["processing", "shipped", "delivered"]);

export async function PATCH(request, { params }) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json().catch(() => ({}));
  if (!VALID_STATUSES.has(status)) {
    return Response.json({ ok: false, error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
  return Response.json({ ok: true });
}
