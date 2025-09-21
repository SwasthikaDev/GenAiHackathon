"""
Production Django settings for Cloudflare deployment.
"""

import os
import dj_database_url
from .settings import *

# Security Settings
DEBUG = False
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

# Allowed hosts for production
ALLOWED_HOSTS = [
    '.pages.dev',  # Cloudflare Pages domains
    '.workers.dev',  # Cloudflare Workers domains
    os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(','),
]
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS if host.strip()]

# Database Configuration
# Use DATABASE_URL environment variable (works with most cloud providers)
DATABASES = {
    'default': dj_database_url.parse(
        os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Static Files with WhiteNoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# CORS Configuration for Production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in os.environ.get('DJANGO_CORS_ALLOWED_ORIGINS', '').split(',') 
    if origin.strip()
]

# Add Cloudflare Pages patterns
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.pages\.dev$",
    r"^https://.*\.workers\.dev$",
]

# CSRF Configuration
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS + [
    'https://*.pages.dev',
    'https://*.workers.dev',
]

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS Settings (enable when using HTTPS)
if os.environ.get('USE_HTTPS', '0') == '1':
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# Email Configuration (for production)
if os.environ.get('EMAIL_BACKEND'):
    EMAIL_BACKEND = os.environ['EMAIL_BACKEND']
    EMAIL_HOST = os.environ.get('EMAIL_HOST')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', '1') == '1'
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

# Performance Optimizations
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Sentry Integration (optional)
if os.environ.get('SENTRY_DSN'):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=os.environ['SENTRY_DSN'],
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True
    ) 