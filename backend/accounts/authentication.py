"""
Supabase JWT authentication for Django REST Framework.

Supabase issues HS256-signed JWTs on successful authentication. The
frontend sends these access tokens to the backend in the
`Authorization: Bearer <token>` header. This class:

  1. extracts the Bearer token
  2. verifies signature, issuer, audience, and expiry with PyJWT
  3. resolves the local `AppUser` for the Supabase subject
  4. provisions an `AppUser` on first contact (default role = `user`)

Configuration lives in `settings.SUPABASE`. The verification secret is
`SUPABASE_JWT_SECRET`. The token issuer must equal
`{SUPABASE_URL}/auth/v1`.

If verification fails for any reason the class returns `None` so DRF
can fall through to the next authentication class (e.g. SessionAuth for
the admin) or return 401.

The auth class returns the `AppUser` instance as `request.user` so
that DRF's standard permission machinery (`is_authenticated`,
`is_anonymous`, etc.) works out of the box. The decoded JWT claims
are attached to the user via `user._supabase_claims` for any view or
permission that needs them.
"""

from __future__ import annotations

import logging
import uuid
from typing import Optional, Tuple

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from accounts.models import AppUser

logger = logging.getLogger("sessions_marketplace")


def _expected_issuer() -> str:
    url = settings.SUPABASE.get("URL", "").rstrip("/")
    if not url:
        return ""
    return f"{url}/auth/v1"


def _decode_token(token: str) -> dict:
    """Verify and decode a Supabase JWT."""
    cfg = settings.SUPABASE
    secret = cfg.get("JWT_SECRET", "")
    audience = cfg.get("AUDIENCE") or None
    leeway = int(cfg.get("LEEWAY_SECONDS", 30))

    if not secret:
        raise jwt.InvalidTokenError(
            "SUPABASE_JWT_SECRET is not configured on the backend."
        )

    options = {"require": ["exp", "sub"]}
    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience=audience,
        issuer=_expected_issuer() or None,
        leeway=leeway,
        options=options,
    )


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """DRF authentication class that verifies Supabase access tokens."""

    keyword = "Bearer"
    www_authenticate_realm = "api"

    def authenticate(self, request) -> Optional[Tuple[AppUser, str]]:
        header = authentication.get_authorization_header(request).decode("utf-8", "ignore")
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            return None

        token = parts[1]
        try:
            if settings.SUPABASE.get("DISABLE_VERIFICATION"):
                logger.warning(
                    "Supabase JWT verification is DISABLED. "
                    "Do not use this configuration in production."
                )
                # Trust-mode for tests. Still decode to extract `sub`.
                claims = jwt.decode(token, options={"verify_signature": False})
            else:
                claims = _decode_token(token)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token has expired.")
        except jwt.InvalidAudienceError:
            raise exceptions.AuthenticationFailed("Token audience is invalid.")
        except jwt.InvalidIssuerError:
            raise exceptions.AuthenticationFailed("Token issuer is invalid.")
        except jwt.InvalidTokenError as exc:
            logger.info("Rejected Supabase token: %s", exc)
            raise exceptions.AuthenticationFailed("Invalid authentication token.")
        except Exception:  # noqa: BLE001
            logger.exception("Unexpected error verifying Supabase JWT")
            raise exceptions.AuthenticationFailed("Could not verify authentication token.")

        subject = self._extract_subject(claims)
        if subject is None:
            raise exceptions.AuthenticationFailed("Token is missing the subject claim.")

        email = claims.get("email") or ""

        user, _created = AppUser.objects.get_or_create_from_supabase(
            supabase_user_id=subject,
            email=email,
        )
        if not user.is_active:
            raise exceptions.AuthenticationFailed("User account is disabled.")

        # Attach the claims for downstream consumers without breaking the
        # DRF convention of returning the user object.
        setattr(user, "_supabase_claims", claims)
        return user, token

    def authenticate_header(self, request) -> str:
        return f'{self.keyword} realm="{self.www_authenticate_realm}"'

    @staticmethod
    def _extract_subject(claims: dict) -> Optional[uuid.UUID]:
        sub = claims.get("sub")
        if not sub:
            return None
        try:
            return uuid.UUID(str(sub))
        except (ValueError, TypeError):
            return None