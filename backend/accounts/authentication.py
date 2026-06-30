"""
Supabase JWT authentication for Django REST Framework.

Supabase publishes a JSON Web Key Set at
`{SUPABASE_URL}/auth/v1/.well-known/jwks.json` and signs access tokens
asymmetrically (`RS256` or `ES256`) using one of those keys. The
frontend sends those access tokens to the backend in the
`Authorization: Bearer <token>` header. This class:

  1. extracts the Bearer token
  2. fetches (and caches) the Supabase signing key that matches
     the token's `kid` header
  3. verifies signature, issuer, audience, and expiry with PyJWT
  4. resolves the local `AppUser` for the Supabase subject
  5. provisions an `AppUser` on first contact (default role = `user`)

Configuration lives in `settings.SUPABASE`. The token issuer must
equal `{SUPABASE_URL}/auth/v1`.

The legacy `SUPABASE_JWT_SECRET` (HS256) path is preserved as a
fallback so projects that still use symmetric signing keep working.

The auth class returns the `AppUser` instance as `request.user` so
that DRF's standard permission machinery (`is_authenticated`,
`is_anonymous`, etc.) works out of the box. The decoded JWT claims
are attached to the user via `user._supabase_claims` for any view or
permission that needs them.
"""

from __future__ import annotations

import logging
import threading
import uuid
from typing import Optional, Tuple

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from accounts.models import AppUser

logger = logging.getLogger("sessions_marketplace")

# Supabase publishes keys for either algorithm depending on the
# project's JWT signing configuration. Accept both.
_ALLOWED_ALGORITHMS = ("RS256", "ES256", "HS256")

# Process-local cache of the JWKS clients so we don't refetch the
# keys document on every request.
_jwks_clients: dict[str, jwt.PyJWKClient] = {}
_jwks_lock = threading.Lock()


def _expected_issuer() -> str:
    url = settings.SUPABASE.get("URL", "").rstrip("/")
    if not url:
        return ""
    return f"{url}/auth/v1"


def _get_jwks_client(supabase_url: str) -> jwt.PyJWKClient:
    """Lazily build and cache a PyJWKClient for the Supabase URL."""
    if not supabase_url:
        raise jwt.InvalidTokenError(
            "Supabase URL is not configured on the backend."
        )
    cached = _jwks_clients.get(supabase_url)
    if cached is not None:
        return cached
    with _jwks_lock:
        cached = _jwks_clients.get(supabase_url)
        if cached is not None:
            return cached
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        client = jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=600)
        _jwks_clients[supabase_url] = client
        return client


def _decode_with_jwks(token: str) -> dict:
    """Verify using the asymmetric keys published by Supabase."""
    cfg = settings.SUPABASE
    audience = cfg.get("AUDIENCE") or None
    leeway = int(cfg.get("LEEWAY_SECONDS", 30))
    supabase_url = cfg.get("URL", "").rstrip("/")

    options = {"require": ["exp", "sub"]}
    try:
        client = _get_jwks_client(supabase_url)
        signing_key = client.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=list(_ALLOWED_ALGORITHMS),
            audience=audience,
            issuer=_expected_issuer() or None,
            leeway=leeway,
            options=options,
        )
    except jwt.PyJWKClientError as exc:
        # Network / JWKS retrieval error — fall back to legacy mode
        # below only if a static secret is configured.
        raise jwt.InvalidTokenError(f"Could not load Supabase JWKS: {exc}") from exc


def _decode_with_legacy_secret(token: str) -> dict:
    """Fallback path that mirrors the original HS256 behaviour."""
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


def _decode_token(token: str) -> dict:
    """Verify and decode a Supabase JWT.

    Tries JWKS first (the recommended asymmetric path). If the token
    happens to be HS256-signed and a shared secret is configured,
    the legacy path takes over.
    """
    cfg = settings.SUPABASE
    secret = cfg.get("JWT_SECRET", "") or None
    leeway = int(cfg.get("LEEWAY_SECONDS", 30))
    options = {"require": ["exp", "sub"]}

    # Peek the alg in the header without verifying anything — we just
    # use it to route to the right verification strategy.
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        raise jwt.InvalidTokenError(f"Malformed token header: {exc}") from exc

    alg = (header.get("alg") or "").upper()
    is_asymmetric = alg in {"RS256", "ES256", "RS384", "ES384", "RS512", "ES512"}

    try:
        if is_asymmetric or not secret:
            return _decode_with_jwks(token)
        return _decode_with_legacy_secret(token)
    except jwt.PyJWKClientError:
        # If JWKS couldn't be fetched and we have no secret fallback,
        # surface a clear error instead of a confusing alg exception.
        if not secret:
            raise
        return _decode_with_legacy_secret(token)
    except jwt.InvalidAlgorithmError as exc:
        # The token's alg doesn't match our allow-list. Try the other
        # verifier so projects that switched signing modes still work.
        if is_asymmetric and secret:
            return _decode_with_legacy_secret(token)
        if not is_asymmetric:
            return _decode_with_jwks(token)
        raise exc
    # Suppress unused-name warning while keeping the import-and-config
    # side-effects visible for future maintainers.
    _ = leeway
    _ = options


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