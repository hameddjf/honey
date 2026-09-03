import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";
import { rowToProduct, productToRow } from "@/lib/dbProducts";

export async function PUT(request, { params }) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const row = productToRow(slug, body);

  await env.DB.prepare(
    `UPDATE products SET
       title=?, tagline=?, emoji=?, price=?, old_price=?, weight=?, badge=?, origin=?,
       harvest=?, purity=?, image=?, description=?, benefits=?, sort_order=?, updated_at=datetime('now')
     WHERE slug=?`
  )
    .bind(
      row.title, row.tagline, row.emoji, row.price, row.old_price, row.weight, row.badge,
      row.origin, row.harvest, row.purity, row.image, row.description, row.benefits, row.sort_order, slug
    )
    .run();

  const saved = await env.DB.prepare("SELECT * FROM products WHERE slug = ?").bind(slug).first();
  if (!saved) return Response.json({ ok: false, error: "محصول پیدا نشد." }, { status: 404 });
  return Response.json({ ok: true, product: rowToProduct(saved) });
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  await env.DB.prepare("DELETE FROM products WHERE slug = ?").bind(slug).run();
  return Response.json({ ok: true });
}
