// Server-side (RSC / metadata / sitemap) helper for reading the public Django API.
// Never throws: returns null on any failure so builds don't depend on the backend.
import { API_BASE_URL } from "./api/client";

export async function serverFetchJson(path, { revalidate = 300, timeoutMs = 4000 } = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
