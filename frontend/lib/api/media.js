// لایه‌ی مدیریت کتابخانه‌ی رسانه برای پنل ادمین — نسخه‌ی متصل به Django.
//
// جایگزین داده‌ی دمو (localStorage-only, در lib/adminStore.js) برای صفحه‌ی
// /admin/media؛ همه‌ی عملیات (لیست، آپلود، ویرایش برچسب/متادیتا، حذف)
// اکنون واقعاً روی مدل content.MediaAsset در بک‌اند انجام می‌شود.

import { api } from "./client";

export function listMedia() {
  return api.get("/media/", { auth: true });
}

/** file: a browser File/Blob from an <input type="file">. */
export function uploadMedia(file, { label = "", tag = "", altText = "" } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (label) formData.append("label", label);
  if (tag) formData.append("tag", tag);
  if (altText) formData.append("alt_text", altText);
  return api.upload("/media/", formData, { auth: true });
}

/** patch: any of { label, tag, alt_text, is_active }. */
export function updateMedia(id, patch) {
  return api.patch(`/media/${encodeURIComponent(id)}/`, patch, { auth: true });
}

export function deleteMedia(id) {
  return api.delete(`/media/${encodeURIComponent(id)}/`, { auth: true });
}
