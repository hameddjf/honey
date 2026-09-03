import { clearCustomerSessionCookie } from "@/lib/serverAuth";

export async function POST() {
  await clearCustomerSessionCookie();
  return Response.json({ ok: true });
}
