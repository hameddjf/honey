import { env } from "cloudflare:workers";
import { requireAdmin } from "@/lib/serverAuth";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export async function GET() {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { results } = await env.DB.prepare("SELECT * FROM site_content").all();
  const content = { ...DEFAULT_SITE_CONTENT };
  for (const row of results) {
    try {
      content[row.key] = { ...(content[row.key] || {}), ...JSON.parse(row.value) };
    } catch {}
  }
  return Response.json({ ok: true, content });
}

// body: { key: "hero" | "topbar" | "video" | "footer", value: {...} }
export async function PUT(request) {
  const session = await requireAdmin(env);
  if (!session) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { key, value } = await request.json().catch(() => ({}));
  if (!key || typeof value !== "object") {
    return Response.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO site_content (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
    .bind(key, JSON.stringify(value))
    .run();

  return Response.json({ ok: true });
}
