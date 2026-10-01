// کمک‌تابع‌های سفارش: ساخت سفارش واقعی روی Django و تبدیل شکل پاسخ بک‌اند
// به همان شکلی که کامپوننت‌های UI (فاکتور/حساب کاربری) از قبل انتظارش را
// دارند — تا تغییرات در آن کامپوننت‌ها کمینه بماند.

import { api } from "./client";

export const STATUS_LABEL = {
  pending: { label: "در انتظار تأیید", cls: "processing" },
  confirmed: { label: "تأیید شده", cls: "processing" },
  preparing: { label: "در حال آماده‌سازی", cls: "processing" },
  shipped: { label: "ارسال شده", cls: "shipped" },
  delivered: { label: "تحویل داده شده", cls: "delivered" },
  cancelled: { label: "لغو شده", cls: "cancelled" },
};

/** Creates a real order on the backend. items: [{ product_id, quantity }] */
export function createOrder({ guestEmail, shippingAddress, contactPhone, customerName, paymentMethod, items }) {
  return api.post("/orders/", {
    guest_email: guestEmail || "",
    shipping_address: shippingAddress || "",
    contact_phone: contactPhone || "",
    customer_name: customerName || "",
    payment_method: paymentMethod || "",
    items,
  }, { auth: true });
}

export function listMyOrders() {
  return api.get("/orders/?page_size=50");
}

/** Fetches a single order by its order_number (UUID) — owner-scoped on the
 * backend: works unauthenticated for guest orders, requires the owning
 * account (or staff) for orders placed while signed in. This is what the
 * backend-derived /invoice/[orderNumber] page reads. */
export function getOrderByNumber(orderNumber) {
  return api.get(`/orders/by-number/${orderNumber}/`, { auth: true });
}

/**
 * Adapts a Django order object into the local shape InvoiceClient/
 * AccountClient already render (id/date/time/customer/items/...).
 * `customerName` is passed in separately because the Order model itself
 * doesn't store a display name (only user FK / guest_email) — see
 * FINAL_REPORT.md "Known limitations".
 */
export function mapOrder(order, { customerName, customerPhone, customerCity, customerPostal } = {}) {
  const created = order.created_at ? new Date(order.created_at) : new Date();
  return {
    id: order.order_number || order.id,
    backendId: order.id,
    date: created.toLocaleDateString("fa-IR"),
    time: created.toLocaleTimeString("fa-IR"),
    customer: {
      name: customerName || order.customer_name || order.customer_email || "",
      phone: customerPhone || order.contact_phone || "",
      city: customerCity || "",
      address: order.shipping_address || "",
      postal: customerPostal || "",
    },
    payment: order.payment_method || order.payment_status,
    items: (order.items || []).map((it) => ({
      key: it.product,
      title: it.product_name,
      weight: "",
      image: "",
      qty: it.quantity,
      price: parseFloat(it.unit_price),
      lineTotal: parseFloat(it.line_total),
    })),
    subtotal: parseFloat(order.subtotal),
    shipping: parseFloat(order.shipping_cost),
    total: parseFloat(order.total),
    status: order.status,
  };
}
