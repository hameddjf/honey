// کمک‌تابع‌های بازیابی رمز عبور — سه مرحله‌ی واقعی روی بک‌اند جنگو.
// هیچ‌کدام از این توابع کد تأیید (OTP) را در کنسول/لاگ چاپ نمی‌کنند —
// فقط پاسخ بک‌اند (که خودش هرگز OTP را برنمی‌گرداند) رد و بدل می‌شود.

import { api } from "./client";

export function requestPasswordReset(email) {
  return api.post("/accounts/password-reset/request/", { email }, { auth: false });
}

export function verifyPasswordResetOtp(email, code) {
  return api.post("/accounts/password-reset/verify/", { email, code }, { auth: false });
}

export function confirmPasswordReset(resetToken, newPassword) {
  return api.post(
    "/accounts/password-reset/confirm/",
    { reset_token: resetToken, new_password: newPassword },
    { auth: false }
  );
}
