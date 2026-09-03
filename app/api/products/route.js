import { env } from "cloudflare:workers";
import { rowToProduct } from "@/lib/dbProducts";

export async function GET() {
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY sort_order ASC, created_at ASC"
  ).all();

  const products = results.map(rowToProduct);
  return Response.json({ ok: true, products });
}
