import { clearSessionCookie } from "@/lib/serverAuth";

export async function POST() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
