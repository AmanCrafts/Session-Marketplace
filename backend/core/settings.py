"""
Django settings for the Sessions Marketplace backend.

The backend is a Django + DRF API that:
  - verifies Supabase Auth JWTs on protected requests
  - owns authorization and business logic
  - persists data to PostgreSQL

All configuration is environment driven. See `.env.example` for the
list of supported variables.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env early so all settings can reference it.
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool = False) -> bool:
    """Parse a boolean from an environment variable."""
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: list[str] | None = None) -> list[str]:
    """Parse a comma-separated list from an environment variable."""
    raw = os.getenv(name)
    if not raw:
        return list(default or [])
    return [item.strip() for item in raw.split(",") if item.strip()]


# --------------------------------------------------------------------------- #
# Core
# --------------------------------------------------------------------------- #

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-do-not-use-in-production",
)

DEBUG = _env_bool("DJANGO_DEBUG", default=True)

ALLOWED_HOSTS = _env_list(
    "DJANGO_ALLOWED_HOSTS",
    default=["*"] if DEBUG else [],
)

# --------------------------------------------------------------------------- #
# Applications
# --------------------------------------------------------------------------- #

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    # Local apps
    "common.apps.CommonConfig",
    "accounts.apps.AccountsConfig",
    "profiles.apps.ProfilesConfig",
    "sessions.apps.SessionsConfig",
    "bookings.apps.BookingsConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# --------------------------------------------------------------------------- #
# Database
# --------------------------------------------------------------------------- #

if _env_bool("DATABASE_USE_POSTGRES", default=True):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "sessions"),
            "USER": os.getenv("POSTGRES_USER", "sessions"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "sessions"),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": int(os.getenv("POSTGRES_CONN_MAX_AGE", "60")),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# --------------------------------------------------------------------------- #
# Authentication
# --------------------------------------------------------------------------- #
#
# The backend does not own user passwords. Authentication happens in
# Supabase. The custom DRF authentication class in `accounts` verifies
# the Supabase JWT and maps it to a local `AppUser` record.
#
# We disable Django's password validators because no passwords are
# stored locally.

AUTH_PASSWORD_VALIDATORS = []

AUTH_USER_MODEL = "accounts.AppUser"

# --------------------------------------------------------------------------- #
# DRF
# --------------------------------------------------------------------------- #

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.SupabaseJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",  # admin only
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": int(os.getenv("REST_FRAMEWORK_PAGE_SIZE", "20")),
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Sessions Marketplace API",
    "DESCRIPTION": (
        "REST API for the Sessions Marketplace. Authentication is "
        "performed by Supabase on the client. The frontend sends the "
        "Supabase access token in the `Authorization: Bearer <token>` "
        "header. The backend verifies the token, derives the local "
        "`AppUser`, and enforces all authorization rules."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/",
}

# --------------------------------------------------------------------------- #
# CORS
# --------------------------------------------------------------------------- #

CORS_ALLOWED_ORIGINS = _env_list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-requested-with",
]

# --------------------------------------------------------------------------- #
# Supabase JWT verification
# --------------------------------------------------------------------------- #

SUPABASE = {
    # The Supabase project URL. The JWT issuer is `<url>/auth/v1`.
    "URL": os.getenv("SUPABASE_URL", "").rstrip("/"),
    # The JWT secret is used to verify HS256 access tokens issued by
    # Supabase Auth. Do NOT commit a real secret.
    "JWT_SECRET": os.getenv("SUPABASE_JWT_SECRET", ""),
    # Optional audience claim check. Set to the project's "anon" or
    # "authenticated" audience depending on your Supabase configuration.
    "AUDIENCE": os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
    # Allowed leeway in seconds when checking `exp`/`nbf`.
    "LEEWAY_SECONDS": int(os.getenv("SUPABASE_JWT_LEEWAY_SECONDS", "30")),
    # When True the verification step is skipped. Use only for tests.
    "DISABLE_VERIFICATION": _env_bool(
        "SUPABASE_JWT_DISABLE_VERIFICATION", default=False
    ),
}

# --------------------------------------------------------------------------- #
# Internationalization
# --------------------------------------------------------------------------- #

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------- #
# Static / media
# --------------------------------------------------------------------------- #

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# --------------------------------------------------------------------------- #
# Logging
# --------------------------------------------------------------------------- #

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if not DEBUG else "DEBUG").upper()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": (
                "%(asctime)s [%(levelname)s] %(name)s: "
                "%(message)s"
            ),
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": LOG_LEVEL,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django.db.backends": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
        "sessions_marketplace": {
            "level": LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

logger = logging.getLogger("sessions_marketplace")