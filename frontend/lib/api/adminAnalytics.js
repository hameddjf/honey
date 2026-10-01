import { api } from "./client";

export const getDashboard = () => api.get("/admin/dashboard/", { auth: true });

export function getReports({ from, to } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return api.get(`/admin/reports/${q ? `?${q}` : ""}`, { auth: true });
}
