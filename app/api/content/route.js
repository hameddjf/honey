import { env } from "cloudflare:workers";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export async function GET() {
  const { results } = await env.DB.prepare("SELECT * FROM site_content").all();
  const content = { ...DEFAULT_SITE_CONTENT };
  for (const row of results) {
    try {
      content[row.key] = { ...(content[row.key] || {}), ...JSON.parse(row.value) };
    } catch {}
  }
  return Response.json({ ok: true, content });
}
