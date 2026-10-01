#!/usr/bin/env python3
"""
manage.py — اسکریپت مدیریتی ریشه‌ی پروژه‌ی نیکا هانی.

الان فقط یک وظیفه داره: بررسی وجود اسکریپت دانلود تصاویر
(scripts/download-images.mjs) و در صورت وجود، اجرای آن با node
تا تصاویر واقعی از Pexels در public/images دانلود بشن. بعد از
دانلود موفق، اسکریپت جایگزینی لینک‌ها (scripts/replace-image-urls.py)
هم به‌صورت خودکار اجرا می‌شود تا مسیرهای پکسلز در کد به مسیرهای
لوکال تبدیل شوند.

استفاده:
    python3 manage.py download-images
    python3 manage.py replace-urls        # فقط جایگزینی (بدون دانلود مجدد)
    python3 manage.py                     # معادل download-images
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOWNLOAD_SCRIPT = ROOT / "scripts" / "download-images.mjs"
REPLACE_SCRIPT = ROOT / "scripts" / "replace-image-urls.py"


def run_download_images() -> bool:
    """اگر اسکریپت دانلود تصاویر وجود داشته باشد، آن را با node اجرا می‌کند."""
    if not DOWNLOAD_SCRIPT.exists():
        print(f"✗ فایل {DOWNLOAD_SCRIPT.relative_to(ROOT)} پیدا نشد؛ دانلود انجام نشد.")
        return False

    print(f"→ اجرای {DOWNLOAD_SCRIPT.relative_to(ROOT)} با node ...\n")
    result = subprocess.run(["node", str(DOWNLOAD_SCRIPT)], cwd=ROOT)

    if result.returncode != 0:
        print("\n✗ دانلود تصاویر با خطا مواجه شد (مثلاً به دلیل محدودیت دسترسی شبکه به pexels.com).")
        return False

    print("\n✓ دانلود تصاویر با موفقیت انجام شد.")
    return True


def run_replace_urls() -> bool:
    """اگر اسکریپت جایگزینی لینک‌ها وجود داشته باشد، آن را اجرا می‌کند."""
    if not REPLACE_SCRIPT.exists():
        print(f"✗ فایل {REPLACE_SCRIPT.relative_to(ROOT)} پیدا نشد؛ جایگزینی لینک‌ها انجام نشد.")
        return False

    print(f"\n→ اجرای {REPLACE_SCRIPT.relative_to(ROOT)} برای جایگزینی لینک‌های Pexels با مسیر لوکال ...\n")
    result = subprocess.run([sys.executable, str(REPLACE_SCRIPT)], cwd=ROOT)
    return result.returncode == 0


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else "download-images"

    if command == "download-images":
        ok = run_download_images()
        if ok:
            run_replace_urls()
        else:
            sys.exit(1)
    elif command == "replace-urls":
        ok = run_replace_urls()
        sys.exit(0 if ok else 1)
    else:
        print(f"دستور ناشناخته: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
