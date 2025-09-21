#!/usr/bin/env python3
"""
Send a test email via Resend (if configured) or Django email backend.

Usage:
  python scripts/test_email.py --to someone@example.com
"""
import argparse
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except Exception:  # optional
    def load_dotenv(*args, **kwargs):
        return False

# Load .env from backend and project root
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

from gt_backend.email_utils import send_email  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--to", required=True)
    args = parser.parse_args()

    use_resend = bool(os.getenv("RESEND_API_KEY"))
    ok = send_email(
        to=args.to,
        subject="GlobalTrotters test email",
        text="This is a test email from GlobalTrotters. If you received this, email is configured correctly.",
    )
    print({
        "to": args.to,
        "ok": ok,
        "via": "resend" if use_resend else "django_email_backend",
        "from": os.getenv("RESEND_FROM_EMAIL") or os.getenv("DJANGO_DEFAULT_FROM_EMAIL", "no-reply@globaltrotters.app"),
    })


if __name__ == "__main__":
    main()


