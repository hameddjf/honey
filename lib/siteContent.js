// محتوای قابل‌ویرایش سایت (هیرو، ویدئوی معرفی، فوتر و پیام بالای سایت).
// این مقادیر پیش‌فرض در صورت نبود رکورد متناظر در جدول site_content استفاده می‌شوند.
// خواندن/نوشتن واقعی از طریق app/api/content و app/api/admin/content (روی D1) انجام می‌شود.

export const DEFAULT_SITE_CONTENT = {
  topbar: {
    message: "ارسال رایگان برای سفارش‌های بالای ۱٬۰۰۰٬۰۰۰ تومان",
  },
  hero: {
    title: "عسل طبیعی نیکا",
    desc: "عسل خالص، بدون افزودنی، مستقیم از طبیعت\nبرای سلامتی شما و عزیزانتان",
    image: "/images/products/jar-closeup.jpg",
    ctaLabel: "مشاهده محصولات",
    ctaHref: "/shop",
  },
  video: {
    label: "نمایش ویدئو",
    embedUrl: "",
    posterImage: "/images/about-photo.jpg",
  },
  footer: {
    tagline: "عسل طبیعی نیکا، هدیه‌ای از دل طبیعت برای سلامتی شما",
    phone: "0912 123 4567",
    email: "info@nikahoney.ir",
    address: "ایران، مازندران، ساری",
    instagram: "#",
    telegram: "#",
    whatsapp: "#",
  },
};
