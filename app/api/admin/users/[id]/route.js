import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";

export async function PATCH(request, { params }) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role } = await request.json().catch(() => ({}));
  if (!["user", "admin"].includes(role)) {
    return Response.json({ ok: false, error: "نقش نامعتبر است." }, { status: 400 });
  }

  await env.DB.prepare("UPDATE customer_users SET role = ? WHERE id = ?").bind(role, id).run();
  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await env.DB.prepare("DELETE FROM customer_users WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
