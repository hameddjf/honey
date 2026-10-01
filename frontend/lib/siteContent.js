// محتوای قابل‌ویرایش سایت (هیرو، ویدئوی معرفی، فوتر و پیام بالای سایت).
//
// بخش‌هایی که در بک‌اند جنگو مدل دارند (هیرو/تاپ‌بار/تماس/شبکه‌های
// اجتماعی/فوتر/بنر) از GET /api/v1/content/ خوانده و با PATCH ذخیره
// می‌شوند — نگاه کنید به lib/api/content.js.
//
// بخش‌هایی که بک‌اند مدل ندارد (ویدئوی معرفی، و متن/لینک دکمه‌ی هیرو و
// بنر) هنوز محلی (localStorage) هستند — چون content.SiteContent عمداً یک
// رکورد سبک است، نه یک CMS کامل (نگاه کنید به content/models.py).
//
// صفحات عمومی سایت (خانه/فروشگاه/محصول/سبد خرید/تماس، و هدر+فوتر مشترک
// همه‌ی صفحات دیگر) اکنون از همین fetchSiteContent() برای هیرو/تاپ‌بار/
// فوتر/تماس/شبکه‌های اجتماعی استفاده می‌کنند — نگاه کنید به
// app/_shared/SiteChrome.js و app/_bodyContent.js (buildBodyHTML). فقط
// صفحه‌ی تک‌پست بلاگ هنوز روی مقادیر پیش‌فرض ثابت مانده (محدودیت شناخته‌شده).

import { fetchSiteContentApi, updateSiteContentApi, toBackendPayload, fromBackendPayload } from "./api/content";

const KEY = "nika_site_content"; // فقط برای فیلدهای محلی (ویدئو / CTA ها)

export const DEFAULT_SITE_CONTENT = {
  topbar: {
    message: "ارسال رایگان برای سفارش‌های بالای ۱٬۰۰۰٬۰۰۰ تومان",
    active: false, // مطابق پیش‌فرض topbar_is_active در بک‌اند — تا فعال نشود نمایش داده نمی‌شود
  },
  hero: {
    title: "عسل طبیعی نیکا",
    desc: "عسل خالص، بدون افزودنی، مستقیم از طبیعت\nبرای سلامتی شما و عزیزانتان",
    image: "https://images.pexels.com/photos/4480158/pexels-photo-4480158.jpeg?cs=srgb&dl=pexels-ian-panelo-4480158.jpg&fm=jpg",
    ctaLabel: "مشاهده محصولات",
    ctaHref: "/shop",
  },
  video: {
    label: "نمایش ویدئو",
    embedUrl: "",
    posterImage: "https://images.pexels.com/photos/5247982/pexels-photo-5247982.jpeg?cs=srgb&dl=pexels-anete-lusina-5247982.jpg&fm=jpg",
  },
  promo: {
    enabled: false,
    message: "",
    ctaLabel: "",
    ctaHref: "",
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

function deepMerge(base, override) {
  if (!override || typeof override !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(base)) {
    if (override[key] === undefined || override[key] === null) continue;
    if (typeof base[key] === "object" && base[key] !== null && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

/** Sync, local-only read (used for the very first paint before fetchSiteContent() resolves). */
export function getSiteContent() {
  if (typeof window === "undefined") return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(KEY);
    const override = raw ? JSON.parse(raw) : null;
    return deepMerge(DEFAULT_SITE_CONTENT, override);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

/** Real content: local-only fields (video/CTAs) merged with live backend data. */
export async function fetchSiteContent() {
  const local = getSiteContent();
  try {
    const remote = await fetchSiteContentApi();
    return deepMerge(local, fromBackendPayload(remote));
  } catch {
    return local; // بک‌اند در دسترس نیست — دست‌کم مقادیر محلی/پیش‌فرض را نشان بده
  }
}

function saveLocalOnly(content) {
  try {
    // فقط فیلدهای محلی (بدون معادل بک‌اند) را ذخیره می‌کنیم تا در بارگذاری بعدی
    // به‌جای مقادیر بک‌اند، مقادیر محلی قدیمی جایگزین نشوند.
    const localOnly = {
      hero: { ctaLabel: content.hero.ctaLabel, ctaHref: content.hero.ctaHref },
      video: content.video,
      promo: { ctaLabel: content.promo.ctaLabel, ctaHref: content.promo.ctaHref },
    };
    localStorage.setItem(KEY, JSON.stringify(localOnly));
    return true;
  } catch {
    return false;
  }
}

export function saveSiteContent(content) {
  return saveLocalOnly(content);
}

/** Saves both the backend-tracked fields (PATCH /content/) and the local-only ones. */
export async function saveSiteContentRemote(content) {
  saveLocalOnly(content);
  await updateSiteContentApi(toBackendPayload(content));
}

export function resetSiteContent() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
