import { api } from "./client";

export function listCustomers() {
  return api.get("/customers/?page_size=100", { auth: true });
}

export function getCustomerDetail(id) {
  return api.get(`/customers/${id}/`, { auth: true });
}
