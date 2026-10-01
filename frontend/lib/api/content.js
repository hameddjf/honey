import { api } from "./client";

export function fetchSiteContentApi() {
  return api.get("/content/", { auth: false });
}

export function updateSiteContentApi(payload) {
  return api.patch("/content/", payload, { auth: true });
}

/** Local shape (lib/siteContent.js) -> backend SiteContent fields. */
export function toBackendPayload(content) {
  return {
    hero_title: content.hero.title,
    hero_subtitle: content.hero.desc,
    hero_image_url: content.hero.image,
    topbar_message: content.topbar.message,
    topbar_is_active: !!content.topbar.message,
    contact_email: content.footer.email,
    contact_phone: content.footer.phone,
    contact_address: content.footer.address,
    social_instagram: normalizeUrl(content.footer.instagram),
    social_telegram: normalizeUrl(content.footer.telegram),
    social_whatsapp: normalizeUrl(content.footer.whatsapp),
    footer_text: content.footer.tagline,
    promo_message: content.promo.message,
    promo_is_active: !!content.promo.enabled,
    video_label: content.video.label,
    video_embed_url: normalizeUrl(content.video.embedUrl),
    video_poster_image_url: content.video.posterImage,
  };
}
// social links in the demo default to "#" placeholders, which aren't valid
// URLs for Django's URLField — send blank instead so the backend accepts it.
function normalizeUrl(value) {
  if (!value || value === "#") return "";
  return value;
}

/** Backend SiteContent -> a partial patch of the local shape (merge onto DEFAULT_SITE_CONTENT). */
export function fromBackendPayload(data) {
  return {
    hero: { title: data.hero_title, desc: data.hero_subtitle, image: data.hero_image_url },
    topbar: { message: data.topbar_message, active: !!data.topbar_is_active },
    footer: {
      email: data.contact_email,
      phone: data.contact_phone,
      address: data.contact_address,
      instagram: data.social_instagram,
      telegram: data.social_telegram,
      whatsapp: data.social_whatsapp,
      tagline: data.footer_text,
    },
    promo: { message: data.promo_message, enabled: data.promo_is_active },
    video: {
      label: data.video_label,
      embedUrl: data.video_embed_url,
      posterImage: data.video_poster_image_url,
    },
  };
}
