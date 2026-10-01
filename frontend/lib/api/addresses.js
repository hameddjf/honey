import { api } from "./client";

export const listAddresses = async () => {
  const data = await api.get("/addresses/", { auth: true });
  return Array.isArray(data) ? data : data?.results || [];
};
export const createAddress = (body) => api.post("/addresses/", body, { auth: true });
export const updateAddress = (id, body) => api.patch(`/addresses/${id}/`, body, { auth: true });
export const deleteAddress = (id) => api.delete(`/addresses/${id}/`, { auth: true });
export const setDefaultAddress = (id) => updateAddress(id, { is_default: true });
