// پیکربندی یکپارچه‌ی ناوبری پنل ادمین — هم سایدبار، هم breadcrumb بالای صفحه و
// هم پالت فرمان (Cmd/Ctrl+K) از همین یک منبع می‌خوانند تا مسیرها و عنوان‌ها
// در جاهای مختلف با هم ناهماهنگ نشوند.

export const ADMIN_NAV_GROUPS = [
  {
    label: "داشبورد اصلی",
    items: [{ href: "/admin", label: "داشبورد مدیریت", icon: "i-grid", exact: true }],
  },
  {
    label: "فروشگاه و سفارشات",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها", icon: "i-truck", badge: "orders" },
      { href: "/admin/products", label: "محصولات", icon: "i-box", badge: "products" },
      { href: "/admin/customers", label: "مشتریان", icon: "i-users" },
    ],
  },
  {
    label: "محتوا و سیستم",
    items: [
      { href: "/admin/content", label: "مدیریت محتوا", icon: "i-edit" },
      { href: "/admin/media", label: "کتابخانه رسانه", icon: "i-image" },
      { href: "/admin/mockdata", label: "داده‌های نمایشی", icon: "i-database", tag: "DEMO" },
    ],
  },
  {
    label: "گزارشات و تنظیمات",
    items: [
      { href: "/admin/reports", label: "گزارش‌های مالی", icon: "i-trending-up" },
      { href: "/admin/users", label: "کاربران و دسترسی‌ها", icon: "i-user" },
      { href: "/admin/settings", label: "تنظیمات عمومی", icon: "i-sliders" },
    ],
  },
];

export function flattenNav() {
  return ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label })));
}

export function isNavItemActive(item, pathname) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function getPageMeta(pathname) {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(item, pathname)) return { ...item, group: group.label };
    }
  }
  if (pathname === "/admin/profile") {
    return { href: "/admin/profile", label: "پروفایل ادمین", icon: "i-user", group: "حساب کاربری" };
  }
  return { href: pathname, label: "پنل مدیریت", icon: "i-grid", group: "" };
}

// اقدامات سریع پالت فرمان — علاوه بر ناوبری صفحات
export function getQuickActions() {
  return [
    { id: "new-product", label: "افزودن محصول جدید", icon: "i-plus", href: "/admin/products?new=1" },
    { id: "view-orders", label: "مشاهده‌ی سفارش‌های اخیر", icon: "i-truck", href: "/admin/orders" },
    { id: "edit-hero", label: "ویرایش هیرو صفحه‌ی اصلی", icon: "i-edit", href: "/admin/content" },
    { id: "mock-data", label: "مدیریت داده‌های نمایشی", icon: "i-database", href: "/admin/mockdata" },
    { id: "view-site", label: "بازگشت به سایت", icon: "i-home", href: "/" },
  ];
}
