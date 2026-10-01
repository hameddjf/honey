"""
Delivers a password-reset OTP to the user.

Structured as a small channel dispatcher (`send_password_reset_otp`) so a
future SMS channel can be added by implementing `_send_via_sms` and adding
one branch here — nothing else in the reset flow (views/serializers/model)
needs to change. SMS is intentionally NOT implemented yet.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_password_reset_otp(user, code, *, channel, ttl_minutes):
    """
    Sends the OTP through the given channel. Raises on failure — the
    caller decides how to surface that (see accounts/views_password_reset.py).

    NEVER logs the OTP itself — only the fact that a send was attempted.
    """
    if channel == "email":
        _send_via_email(user, code, ttl_minutes)
    else:
        # Deliberately not implemented — see module docstring.
        raise NotImplementedError(f"Unsupported OTP channel: {channel!r}")


def _send_via_email(user, code, ttl_minutes):
    display_name = user.full_name or user.email
    subject = "کد بازیابی رمز عبور – عسل طبیعی نیکا"

    text_body = (
        f"سلام {display_name} عزیز،\n\n"
        "برای بازیابی رمز عبور حساب کاربری‌تان در فروشگاه عسل طبیعی نیکا، "
        "درخواستی ثبت شده است.\n\n"
        f"کد تأیید شما: {code}\n\n"
        f"این کد تا {ttl_minutes} دقیقه دیگر معتبر است.\n\n"
        "اگر شما این درخواست را ثبت نکرده‌اید، این ایمیل را نادیده بگیرید؛ "
        "رمز عبور شما تغییر نخواهد کرد. لطفاً این کد را در اختیار هیچ‌کس "
        "قرار ندهید — پشتیبانی نیکا هرگز این کد را از شما نمی‌پرسد.\n\n"
        "عسل طبیعی نیکا"
    )

    html_body = f"""
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2c2013;">
      <h2 style="color: #b5842f;">عسل طبیعی نیکا</h2>
      <p>سلام {display_name} عزیز،</p>
      <p>برای بازیابی رمز عبور حساب کاربری‌تان درخواستی ثبت شده است. کد تأیید شما:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background: #f7ecd8; padding: 14px 20px; border-radius: 8px; text-align: center;">{code}</p>
      <p>این کد تا <b>{ttl_minutes} دقیقه</b> دیگر معتبر است.</p>
      <p style="font-size: 13px; color: #7a6a52;">اگر شما این درخواست را ثبت نکرده‌اید، این ایمیل را نادیده بگیرید — رمز عبور شما تغییر نخواهد کرد.
      این کد را در اختیار هیچ‌کس قرار ندهید؛ پشتیبانی نیکا هرگز این کد را از شما نمی‌پرسد.</p>
    </div>
    """

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")

    # fail_silently=False: a send failure must surface to the caller so the
    # API can report it, rather than pretending an OTP was delivered.
    message.send(fail_silently=False)
    logger.info("Password-reset OTP email dispatched to user_id=%s", user.id)
