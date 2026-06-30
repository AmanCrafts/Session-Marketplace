# Sessions Marketplace — Backend

Django + Django REST Framework API for the Sessions Marketplace.

Authentication is delegated to **Supabase Auth** on the client. The
backend verifies the Supabase access token on every protected request
and owns all authorization and business logic.

---

## Stack

| Layer       | Choice                                 |
| ----------- | -------------------------------------- |
| Framework   | Django 6 + Django REST Framework        |
| Database    | PostgreSQL 16                          |
| Auth        | Supabase JWT (HS256) verified by PyJWT |
| Filters     | django-filter                          |
| API docs    | drf-spectacular (OpenAPI 3)            |
| WSGI server | gunicorn                               |
| Container   | python:3.12-slim                       |

---

## Project layout

```
backend/
├── accounts/        # AppUser + Supabase JWT auth + current-user views
├── profiles/        # Profile model + /api/me
├── sessions/        # Session catalog and creator CRUD
├── bookings/        # Transactional booking flow
├── common/          # Base models, exceptions, pagination, permissions
├── core/            # Django project (settings, urls, asgi, wsgi)
├── manage.py
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

The architecture follows the docs in `/PRD.md`, `/TRD.md`, and
`/Architecture.md` at the repository root.

---

## Quick start (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_JWT_SECRET at minimum.

python manage.py migrate
python manage.py createsuperuser   # interactive prompt
python manage.py runserver 0.0.0.0:8000
```

The API will be available at `http://localhost:8000/api/`. OpenAPI
docs at `http://localhost:8000/api/docs/`.

> The default `.env.example` enables PostgreSQL. If you want SQLite for
> quick exploration, set `DATABASE_USE_POSTGRES=false`.

---

## Quick start (Docker)

```bash
cd backend
docker build -t sessions-backend .
docker run --rm -p 8000:8000 --env-file .env sessions-backend
```

In the repo's full `docker-compose` stack, the `backend` service runs
the same image and depends on the `db` (PostgreSQL) service.

---

## Environment variables

All configuration lives in environment variables. See `.env.example`
for the canonical list. Key variables:

| Variable                | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `DJANGO_SECRET_KEY`     | Django cryptographic signing                       |
| `DJANGO_DEBUG`          | Toggle debug mode                                  |
| `DJANGO_ALLOWED_HOSTS`  | Comma-separated hostnames                          |
| `POSTGRES_*`            | Database connection                                |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated browser origins                    |
| `SUPABASE_URL`          | Supabase project URL                               |
| `SUPABASE_JWT_SECRET`   | Supabase JWT secret (HS256)                        |
| `SUPABASE_JWT_AUDIENCE` | Expected `aud` claim, default `authenticated`      |
| `SUPABASE_JWT_LEEWAY_SECONDS` | Clock-skew tolerance, default 30             |

---

## Authentication flow

1. The frontend signs the user in via Supabase Auth (OAuth).
2. The frontend receives an access token JWT and stores it via the
   Supabase client.
3. Every API call sends `Authorization: Bearer <access_token>`.
4. `accounts.authentication.SupabaseJWTAuthentication`:
   - extracts the Bearer token
   - verifies signature, issuer, audience, and expiry with PyJWT
   - maps the `sub` claim to a local `AppUser`
   - provisions a new `AppUser` on first contact with `role = user`
5. Roles live on `AppUser.role`, **never** on the JWT. The backend
   treats role claims in the token as untrusted.

If verification fails, the request is rejected with `401 Unauthorized`.
If verification succeeds but the user lacks the required role, the
request is rejected with `403 Forbidden`.

### Promotion to creator

The default role for new users is `user`. To promote a user to creator,
either:

- update the `role` field in Django admin, or
- POST a Supabase user metadata change and let an internal job sync it
  to `AppUser.role`.

The backend never trusts `role` from the token or from client code.

---

## Authorization

`common.permissions.IsCreator` enforces the creator role on protected
endpoints. `sessions.permissions.IsSessionOwner` enforces ownership at
the object level for `Session` mutations.

```
┌─ Public ────────────────┐
│ GET /api/sessions       │
│ GET /api/sessions/<id>  │
└─────────────────────────┘
┌─ Authenticated ─────────┐
│ GET /api/me             │
│ GET /api/me/profile     │
│ PATCH /api/me/profile   │
│ GET /api/bookings/me    │
│ POST /api/bookings      │
│ POST /api/bookings/<id>/cancel │
└─────────────────────────┘
┌─ Creator ───────────────┐
│ GET    /api/creator/sessions       │
│ POST   /api/creator/sessions       │
│ PATCH  /api/creator/sessions/<id>  │
│ DELETE /api/creator/sessions/<id>  │
│ POST   /api/creator/sessions/<id>/status │
│ GET    /api/creator/bookings       │
└─────────────────────────┘
```

### Error envelope

```json
{
  "error": {
    "code": "capacity_exceeded",
    "detail": "Session is fully booked.",
    "status": 409
  }
}
```

---

## Booking safety

`bookings.services.create_booking` runs inside a transaction and
locks the `Session` row with `SELECT ... FOR UPDATE`. Capacity is
re-counted inside the transaction so concurrent bookings cannot
oversell. The service also enforces the duplicate-booking rule (a user
cannot have two active bookings for the same session).

---

## Data model

See `Architecture.md` at the repo root. Summary:

- `AppUser` — local identity linked to a Supabase subject.
- `Profile` — display name, avatar URL, bio.
- `Session` — marketplace listing owned by a creator.
- `Tag` / `SessionTag` — many-to-many labels.
- `SessionImage` — gallery image URLs.
- `Booking` — connects a user to a session; payment fields ready.

UUID primary keys are used throughout.

---

## Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Tests

```bash
python manage.py test
```

Tests default to SQLite to avoid needing Postgres locally. Override
`DATABASE_USE_POSTGRES=true` in your test environment if you prefer.

---

## API documentation

- OpenAPI schema: `/api/schema/`
- Swagger UI:    `/api/docs/`
- Redoc:         `/api/redoc/`

Generated by `drf-spectacular` from serializers and view docstrings.