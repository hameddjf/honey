export async function fetchAdminContent() {
  const res = await fetch("/api/admin/content", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, content: null };
  return { ok: true, content: data.content };
}

export async function saveContentSection(key, value) {
  const res = await fetch("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok };
}
