import { api } from "./client";

// Public read (checkout/shop need it unauthenticated); staff-only write.
export const DEFAULT_STORE_SETTINGS = {
  shipping_enabled: true,
  shipping_flat_cost: "0",
  free_shipping_threshold: null,
  guest_checkout_enabled: true,
  maintenance_mode: false,
  low_stock_threshold: 5,
  notify_new_order: true,
  notify_low_stock: true,
};

export function getStoreSettings() {
  return api.get("/settings/", { auth: false });
}

export function updateStoreSettings(patch) {
  return api.patch("/settings/", patch, { auth: true });
}

/** Display-only estimate; the backend recomputes the real value at order creation. */
export function estimateShipping(settings, subtotal) {
  const s = settings || DEFAULT_STORE_SETTINGS;
  if (!s.shipping_enabled) return 0;
  const threshold = s.free_shipping_threshold;
  if (threshold !== null && threshold !== undefined && subtotal >= parseFloat(threshold)) return 0;
  return parseFloat(s.shipping_flat_cost || 0);
}
