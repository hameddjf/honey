import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";
import { rowToProduct, productToRow } from "@/lib/dbProducts";

function slugify(title) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "product-" + Date.now()
  );
}

export async function GET() {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY sort_order ASC, created_at ASC"
  ).all();
  return Response.json({ ok: true, products: results.map(rowToProduct) });
}

export async function POST(request) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return Response.json({ ok: false, error: "عنوان محصول الزامی است." }, { status: 400 });
  }

  const slug = body.slug ? slugify(body.slug) : slugify(body.title);
  const row = productToRow(slug, body);

  await env.DB.prepare(
    `INSERT INTO products
      (slug, title, tagline, emoji, price, old_price, weight, badge, origin, harvest, purity, image, description, benefits, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title, tagline=excluded.tagline, emoji=excluded.emoji, price=excluded.price,
       old_price=excluded.old_price, weight=excluded.weight, badge=excluded.badge, origin=excluded.origin,
       harvest=excluded.harvest, purity=excluded.purity, image=excluded.image, description=excluded.description,
       benefits=excluded.benefits, sort_order=excluded.sort_order, updated_at=datetime('now')`
  )
    .bind(
      row.slug, row.title, row.tagline, row.emoji, row.price, row.old_price, row.weight,
      row.badge, row.origin, row.harvest, row.purity, row.image, row.description, row.benefits, row.sort_order
    )
    .run();

  const saved = await env.DB.prepare("SELECT * FROM products WHERE slug = ?").bind(slug).first();
  return Response.json({ ok: true, product: rowToProduct(saved) });
}
