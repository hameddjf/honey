import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";

function rowToOrder(row) {
  return {
    id: row.id,
    customer: { name: row.customer_name, phone: row.customer_phone, city: row.customer_city, address: row.customer_address },
    payment: row.payment,
    items: JSON.parse(row.items || "[]"),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return Response.json({ ok: true, orders: results.map(rowToOrder) });
}
