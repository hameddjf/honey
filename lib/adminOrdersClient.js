export async function fetchAdminOrders() {
  const res = await fetch("/api/admin/orders", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, orders: [] };
  return { ok: true, orders: data.orders };
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok };
}
