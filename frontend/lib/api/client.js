// لایه‌ی پایه‌ی ارتباط با بک‌اند جنگو.
//
// همه‌ی درخواست‌های API از اینجا رد می‌شوند تا:
//  - آدرس پایه (NEXT_PUBLIC_API_URL) یک‌جا مدیریت شود،
//  - توکن‌های JWT (access/refresh) در localStorage نگه‌داری و به‌صورت خودکار
//    تازه‌سازی (refresh) شوند،
//  - خطاهای بک‌اند به یک شکل یکنواخت (ApiError) به بقیه‌ی کد برسند.
//
// کامپوننت‌های UI نباید مستقیماً fetch بزنند یا هدر Authorization بسازند —
// همه چیز از طریق apiFetch (یا توابع سطح بالاتر در lib/api/*.js) انجام می‌شود.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const ACCESS_KEY = "nika_access_token";
const REFRESH_KEY = "nika_refresh_token";

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data || null;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access, refresh } = {}) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

export function isAuthenticated() {
  return !!getAccessToken();
}

/** Extracts a readable message out of a DRF error payload. */
function extractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  // DRF field errors: { field: ["msg", ...] } or { non_field_errors: [...] }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    const msg = Array.isArray(value) ? value[0] : value;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/login/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      clearTokens();
      return false;
    }
    const data = await parseResponse(response);
    if (!data?.access) {
      clearTokens();
      return false;
    }
    setTokens({ access: data.access, refresh: data.refresh });
    return true;
  } catch {
    return false;
  }
}

/**
 * Core request helper.
 *
 * @param {string} path - path relative to API_BASE_URL, e.g. "/products/"
 * @param {object} options
 * @param {string} [options.method="GET"]
 * @param {object|FormData|null} [options.body]
 * @param {boolean} [options.auth=true] - attach Authorization header if a token exists
 * @param {boolean} [options.retry=true] - internal: whether a 401 retry-after-refresh is allowed
 * @param {boolean} [options.isFormData=false] - true for file uploads: body is sent as-is
 *   (FormData) with no Content-Type header, so the browser sets
 *   "multipart/form-data; boundary=..." itself. Never JSON.stringify a FormData body.
 */
export async function apiFetch(path, { method = "GET", body, auth = true, retry = true, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.", {
      status: 0,
      data: null,
    });
  }

  if (response.status === 401 && auth && retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, { method, body, auth, retry: false, isFormData });
    }
  }

  if (response.status === 204) return null;

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, `خطای سرور (${response.status})`), {
      status: response.status,
      data,
    });
  }

  return data;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: "GET" }),
  post: (path, body, options) => apiFetch(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: "PUT", body }),
  delete: (path, options) => apiFetch(path, { ...options, method: "DELETE" }),
  /** Multipart upload — pass a real FormData instance as `body`. */
  upload: (path, formData, options) =>
    apiFetch(path, { ...options, method: "POST", body: formData, isFormData: true }),
};
