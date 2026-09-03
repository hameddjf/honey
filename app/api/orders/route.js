import { env } from "cloudflare:workers";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { customer, payment, items, subtotal, shipping, total } = body;

  if (!customer?.name || !customer?.phone || !customer?.city || !customer?.address || !items?.length) {
    return Response.json({ ok: false, error: "اطلاعات سفارش ناقص است." }, { status: 400 });
  }

  const now = new Date();
  const id = "NK-" + now.getTime().toString().slice(-7);

  await env.DB.prepare(
    `INSERT INTO orders (id, customer_name, customer_phone, customer_city, customer_address, payment, items, subtotal, shipping, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`
  )
    .bind(
      id, customer.name, customer.phone, customer.city, customer.address,
      payment || "", JSON.stringify(items), subtotal || 0, shipping || 0, total || 0
    )
    .run();

  const order = {
    id,
    date: now.toLocaleDateString("fa-IR"),
    time: now.toLocaleTimeString("fa-IR"),
    customer,
    payment,
    items,
    subtotal,
    shipping,
    total,
    status: "processing",
  };

  return Response.json({ ok: true, order });
}
