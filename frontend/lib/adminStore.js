// مرکز داده‌های نمایشی (Mock Data Center) پنل ادمین.
//
// این فایل «تنها» منبع کمکی برای داده‌هایی است که مستقیماً به یک ماژول
// اختصاصی تعلق ندارند (سفارش‌ها، مشتریانِ مشتق‌شده از سفارش‌ها، رسانه،
// تنظیمات فروشگاه و گزارش‌های محاسبه‌شده). محصولات همچنان از
// lib/products.js + lib/adminProducts.js و محتوای سایت از lib/siteContent.js
// خوانده می‌شوند — اینجا دوباره تعریف نمی‌شوند تا مخزن داده‌ی دمو یکپارچه
// بماند (طبق الزام پرامپت: «عدم ایجاد چند مخزن دادهٔ دمو موازی»).

import { PRODUCTS } from "./products";

export const ORDER_HISTORY_KEY = "nika_order_history"; // همان کلیدی که چک‌اوت واقعی می‌نویسد
const MEDIA_KEY = "nika_admin_media";
const SETTINGS_KEY = "nika_admin_settings";
const DEMO_FLAG_KEY = "nika_admin_demo_seeded";

const toFa = (n) => n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
export { toFa };
export const formatToman = (n) => `${toFa(Math.round(n || 0).toLocaleString("en-US"))} تومان`;

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ============================== سفارش‌ها ============================== */

export function getOrders() {
  return readJSON(ORDER_HISTORY_KEY, []);
}

export function saveOrders(list) {
  return writeJSON(ORDER_HISTORY_KEY, list);
}

export function updateOrderStatus(orderId, status) {
  const list = getOrders().map((o) => (o.id === orderId ? { ...o, status } : o));
  saveOrders(list);
  return list;
}

const DEMO_NAMES = [
  "زهرا محمدی", "علی رضایی", "سارا احمدی", "محمد کریمی", "نگار حسینی",
  "امیر صادقی", "مریم قاسمی", "حسین نوری", "فاطمه یوسفی", "رضا عباسی",
  "الناز شریفی", "کاوه مرادی", "پریسا اکبری", "دانیال جعفری", "شیوا رستمی",
];
const DEMO_CITIES = ["ساری", "تهران", "مشهد", "اصفهان", "رشت", "تبریز", "کرج", "بابل"];
const STATUS_POOL = ["processing", "processing", "shipped", "shipped", "delivered", "delivered", "delivered"];

function randomPhone() {
  return "09" + String(Math.floor(100000000 + Math.random() * 899999999)).slice(0, 9);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// تولید ~۱۸ سفارش نمونه در ۱۴ روز اخیر، با اقلام واقعی از کاتالوگ محصولات —
// فقط برای پر کردن داشبورد/گزارش‌ها/مشتریان با داده‌ی قابل‌فهم در یک مرورگر تازه.
export function seedDemoOrders(count = 18) {
  const slugs = Object.keys(PRODUCTS);
  const now = Date.now();
  const generated = [];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const d = new Date(now - daysAgo * 86400000 - Math.floor(Math.random() * 86400000));
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const chosen = [...slugs].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    const items = chosen.map((key) => {
      const p = PRODUCTS[key];
      const price = Number(String(p.price).replace(/[^\d]/g, "")) || 250000;
      const qty = 1 + Math.floor(Math.random() * 2);
      return { key, title: p.title, weight: p.weight, image: p.image, qty, price, lineTotal: price * qty };
    });

    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const shipping = subtotal >= 1000000 ? 0 : 35000;
    const total = subtotal + shipping;
    const name = pick(DEMO_NAMES);

    generated.push({
      id: "NK-DEMO-" + (now - i * 137).toString().slice(-7),
      demo: true,
      date: d.toLocaleDateString("fa-IR"),
      time: d.toLocaleTimeString("fa-IR"),
      timestamp: d.getTime(),
      customer: { name, phone: randomPhone(), city: pick(DEMO_CITIES), address: `${pick(DEMO_CITIES)}، خیابان نمونه، پلاک ${1 + Math.floor(Math.random() * 90)}` },
      payment: pick(["online", "cod"]),
      items,
      subtotal,
      shipping,
      total,
      status: pick(STATUS_POOL),
    });
  }

  generated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // سفارش‌های واقعیِ همین مرورگر (اگر بود) حفظ می‌شوند و نمونه‌ها به آن‌ها اضافه می‌شوند
  const existingReal = getOrders().filter((o) => !o.demo);
  saveOrders([...existingReal, ...generated].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
  writeJSON(DEMO_FLAG_KEY, true);
  return generated.length;
}

export function clearDemoOrders() {
  const real = getOrders().filter((o) => !o.demo);
  saveOrders(real);
}

export function isDemoSeeded() {
  return !!readJSON(DEMO_FLAG_KEY, false);
}

/* ============================== مشتریان (مشتق از سفارش‌ها) ============================== */

export function getCustomers() {
  const orders = getOrders();
  const byPhone = new Map();

  for (const o of orders) {
    const phone = o.customer?.phone || "نامشخص";
    const prev = byPhone.get(phone) || {
      phone,
      name: o.customer?.name || "مشتری مهمان",
      city: o.customer?.city || "",
      address: o.customer?.address || "",
      orderCount: 0,
      totalSpent: 0,
      lastOrderDate: o.date,
      lastTimestamp: o.timestamp || 0,
      demo: !!o.demo,
    };
    prev.orderCount += 1;
    prev.totalSpent += o.total || 0;
    const ts = o.timestamp || 0;
    if (ts >= prev.lastTimestamp) {
      prev.lastTimestamp = ts;
      prev.lastOrderDate = o.date;
    }
    byPhone.set(phone, prev);
  }

  return Array.from(byPhone.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

/* ============================== رسانه ============================== */

function seedMedia() {
  const fromProducts = Object.entries(PRODUCTS).map(([slug, p]) => ({
    id: "prod-" + slug,
    url: p.image,
    label: p.title,
    tag: "محصول",
    addedAt: Date.now(),
  }));
  const extras = [
    { id: "m-hero", url: "/images/products/jar-closeup.jpg", label: "نمای نزدیک شیشه عسل", tag: "هیرو", addedAt: Date.now() },
    { id: "m-about", url: "/images/about-photo.jpg", label: "تصویر درباره ما", tag: "محتوا", addedAt: Date.now() },
  ];
  return [...extras, ...fromProducts];
}

export function getMedia() {
  const existing = readJSON(MEDIA_KEY, null);
  if (existing) return existing;
  const seeded = seedMedia();
  writeJSON(MEDIA_KEY, seeded);
  return seeded;
}

export function addMediaDemo(label = "تصویر جدید") {
  const list = getMedia();
  const item = {
    id: "up-" + Date.now(),
    url: pick([
      "/images/products/citrus.jpg",
      "/images/products/dark.jpg",
      "/images/products/forest.jpg",
      "/images/products/sunflower.jpg",
      "/images/products/blossom.jpg",
      "/images/products/jar-closeup.jpg",
      "/images/products/mix.jpg",
    ]),
    label,
    tag: "آپلود دمو",
    addedAt: Date.now(),
  };
  const updated = [item, ...list];
  writeJSON(MEDIA_KEY, updated);
  return updated;
}

export function deleteMedia(id) {
  const updated = getMedia().filter((m) => m.id !== id);
  writeJSON(MEDIA_KEY, updated);
  return updated;
}

export function resetMedia() {
  const seeded = seedMedia();
  writeJSON(MEDIA_KEY, seeded);
  return seeded;
}

/* ============================== تنظیمات فروشگاه ============================== */

export const DEFAULT_SETTINGS = {
  store: {
    name: "عسل طبیعی نیکا",
    ownerName: "مدیر فروشگاه",
    email: "info@nikahoney.ir",
    phone: "0912 123 4567",
    address: "ایران، مازندران، ساری",
    currency: "تومان",
  },
  shipping: {
    freeShippingThreshold: 1000000,
    defaultShippingCost: 35000,
    processingDays: "۱ تا ۲ روز کاری",
    zones: "سراسر ایران",
  },
  general: {
    maintenanceMode: false,
    allowGuestCheckout: true,
    lowStockThreshold: 10,
  },
  notifications: {
    newOrderEmail: true,
    lowStockAlert: true,
    weeklySummary: false,
  },
};

function deepMerge(base, override) {
  if (!override || typeof override !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(base)) {
    if (override[key] === undefined) continue;
    if (typeof base[key] === "object" && base[key] !== null && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

export function getSettings() {
  return deepMerge(DEFAULT_SETTINGS, readJSON(SETTINGS_KEY, null));
}

export function saveSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {}
  return DEFAULT_SETTINGS;
}

/* ============================== گزارش‌ها (مشتق از سفارش‌ها) ============================== */

export function computeReportData() {
  const orders = getOrders();

  const revenueByDay = new Map();
  const categoryQty = new Map(); // slug -> qty
  let totalRevenue = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;

  for (const o of orders) {
    const day = o.date || "—";
    revenueByDay.set(day, (revenueByDay.get(day) || 0) + (o.total || 0));
    totalRevenue += o.total || 0;
    if (o.status === "delivered") deliveredCount += 1;
    if (o.status === "cancelled") cancelledCount += 1;
    for (const it of o.items || []) {
      categoryQty.set(it.key, (categoryQty.get(it.key) || 0) + (it.qty || 0));
    }
  }

  const trend = Array.from(revenueByDay.entries())
    .slice(-14)
    .map(([label, value]) => ({ label, value }));

  const byProduct = Array.from(categoryQty.entries())
    .map(([slug, qty]) => ({ slug, title: PRODUCTS[slug]?.title || slug, qty }))
    .sort((a, b) => b.qty - a.qty);

  const aov = orders.length ? totalRevenue / orders.length : 0;

  return {
    orderCount: orders.length,
    totalRevenue,
    aov,
    deliveredCount,
    cancelledCount,
    trend,
    byProduct,
  };
}

/* ============================== ریست کامل داده‌های دمو ============================== */

export function resetAllDemoData() {
  const keys = [
    ORDER_HISTORY_KEY,
    MEDIA_KEY,
    SETTINGS_KEY,
    DEMO_FLAG_KEY,
    "nika_admin_products_override",
    "nika_admin_products_deleted",
    "nika_site_content",
  ];
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
}
