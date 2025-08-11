import os
from typing import Optional, Union, List

import requests
from django.conf import settings
from django.core.mail import send_mail as django_send_mail


def send_email(
    to: Union[str, List[str]],
    subject: str,
    text: str,
    html: Optional[str] = None,
) -> bool:
    """Send email via Resend if RESEND_API_KEY is set; fall back to Django email backend.

    Returns True on best-effort success, False on failure.
    """
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev"))
    recipients = [to] if isinstance(to, str) else to

    if api_key:
        try:
            payload = {
                "from": from_email,
                "to": recipients,
                "subject": subject,
                "text": text,
            }
            if html:
                payload["html"] = html
            r = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            r.raise_for_status()
            return True
        except Exception:
            # fall back to Django backend
            pass

    try:
        django_send_mail(subject, text, from_email, recipients, fail_silently=False)
        return True
    except Exception:
        return False


