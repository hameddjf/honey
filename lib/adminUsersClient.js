export async function fetchUsers() {
  const res = await fetch("/api/admin/users", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, users: [] };
  return { ok: true, users: data.users };
}

export async function setUserRole(id, role) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok };
}

export async function deleteUserById(id) {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok };
}
