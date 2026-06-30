# Technical Requirements Document (TRD)

## 1. Technical Overview

The application will use a modular monolith architecture:

* **Frontend:** React with Tailwind CSS, client-side only
* **Auth:** Supabase Auth on the client side
* **Backend:** Django + Django REST Framework
* **Database:** PostgreSQL
* **Infrastructure:** Docker Compose with frontend, backend, database, and Nginx reverse proxy

In this design, Supabase Auth is responsible for sign-in and session management on the client side, and the backend is responsible for all authorization, ownership checks, validation, and business logic. Supabase Auth issues JWT access tokens for signed-in sessions, and a session also includes a refresh token. The backend will consume the Supabase access token from the `Authorization: Bearer <token>` header and validate it before serving protected endpoints. ([Supabase][1])

## 2. Architecture Goals

* Keep the system easy to evaluate and run.
* Separate authentication from authorization.
* Make session booking transaction-safe.
* Keep creator-owned resources isolated by ownership rules.
* Support bonus features without reworking core models.
* Preserve clean boundaries between presentation, API, services, and persistence layers.

## 3. Recommended Stack

### Frontend

* React
* Tailwind CSS
* React Router
* TanStack Query
* Axios
* React Hook Form
* Zod
* Zustand only if client state becomes non-trivial

### Backend

* Django
* Django REST Framework
* `django-cors-headers`
* `django-filter`
* `drf-spectacular` for OpenAPI
* Custom DRF authentication class for Supabase JWT verification
* PostgreSQL
* Optional: Redis for rate limiting or caching if needed later

DRF supports custom authentication schemes by subclassing `BaseAuthentication` and implementing `.authenticate()`, which fits this architecture well. ([django-rest-framework.org][2])

## 4. Auth Architecture

### 4.1 Login Flow

1. User clicks Google or GitHub sign-in in the React app.
2. Supabase Auth handles OAuth login on the client.
3. Supabase returns a session containing an access token JWT and refresh token.
4. The React app stores the session through the Supabase client.
5. For API calls, React sends the access token in the `Authorization` header.
6. Django validates the token and derives the authenticated user identity from it. ([Supabase][1])

### 4.2 Backend Authentication Responsibility

The backend will not trust the frontend session by itself. It will:

* verify token authenticity
* verify expiry
* extract the Supabase subject claim
* map the external identity to a local user record
* enforce all authorization rules server-side

Supabase documents that its JWTs contain claims such as issuer, subject, role, email, and expiry, and it provides signing-key guidance for server-side verification. ([Supabase][3])

### 4.3 Role Model

Roles should be stored in the backend database, not inferred from the OAuth provider.

* **User**: browse, book, view personal dashboard
* **Creator**: user privileges plus session CRUD and booking overview

This keeps role enforcement under backend control even though authentication starts in Supabase.

## 5. Backend Layering

The backend should not be a single thick `views.py` file. Use a layered structure:

* **Views / API layer**: request parsing, response formatting
* **Serializers**: validation and output shaping
* **Services**: business logic
* **Permissions**: access control rules
* **Models**: persistence and relations
* **Selectors / Query helpers**: reusable read queries if needed

This is a modular monolith with clear boundaries. It looks more professional and is easier to extend.

## 6. Backend Apps / Modules

Recommended Django app split:

* `accounts`
* `profiles`
* `sessions`
* `bookings`
* `payments` optional
* `media` or `storage` optional
* `common`

### Responsibilities

* `accounts`: local user mapping, role resolution, auth adapter logic
* `profiles`: profile view/update
* `sessions`: session CRUD and publishing flow
* `bookings`: booking creation, cancellation, history, capacity validation
* `payments`: payment intent / webhook hooks if bonus feature is implemented
* `storage`: image upload abstraction for S3/MinIO later

## 7. Frontend Architecture

Use feature-based organization:

* `src/features/auth`
* `src/features/sessions`
* `src/features/bookings`
* `src/features/profile`
* `src/features/creator`
* `src/shared/api`
* `src/shared/components`
* `src/shared/utils`
* `src/layouts`
* `src/routes`

### Frontend Responsibilities

* render public catalog and details
* drive Supabase Auth login/logout
* store and use access token via Supabase session
* call backend APIs
* display loading, empty, and error states
* protect dashboard routes at the UI level

### Frontend Non-Goals

* no business logic duplication
* no authorization decisions beyond basic route gating
* no backend token minting

## 8. Data Model

### Core Entities

1. **User Profile**

   * id
   * auth provider user id
   * name
   * avatar URL
   * role
   * timestamps

2. **Session**

   * id
   * creator id
   * title
   * description
   * category
   * difficulty
   * duration
   * price
   * capacity
   * scheduled date/time
   * location or delivery mode
   * published status
   * tags
   * thumbnail URL
   * timestamps

3. **Booking**

   * id
   * session id
   * user id
   * status
   * booked_at
   * canceled_at
   * payment status if payments exist
   * timestamps

4. **OAuth Identity Mapping** if needed

   * external subject id
   * provider name
   * local user id

### Optional Entities

* **Payment**
* **SessionImage**
* **AuditLog**
* **RateLimitEvent** if you want to show advanced discipline

## 9. Booking and Session Rules

### Session Rules

* Only creators can create/update/delete their own sessions.
* Only published sessions appear in the public catalog.
* Sessions should expose enough metadata to look like a real marketplace listing.

### Booking Rules

* Only authenticated users can book.
* Capacity must be enforced in a transaction.
* Duplicate bookings should be blocked if your business rule disallows them.
* Users can view active and past bookings.
* Creators can view bookings only for sessions they own.

### Transaction Requirement

Booking creation must be atomic so that capacity cannot be oversold under concurrent requests.

## 10. API Design

### Public APIs

* `GET /api/sessions`
* `GET /api/sessions/:id`

### Authenticated User APIs

* `GET /api/me`
* `PATCH /api/me`
* `GET /api/bookings/me`
* `POST /api/bookings`

### Creator APIs

* `GET /api/creator/sessions`
* `POST /api/creator/sessions`
* `PATCH /api/creator/sessions/:id`
* `DELETE /api/creator/sessions/:id`
* `GET /api/creator/bookings`

### Optional Payments APIs

* `POST /api/payments/create-intent`
* `POST /api/payments/webhook`

### API Principles

* RESTful naming
* pagination for lists
* filter/search support for catalog
* standardized error envelope
* owner checks on creator endpoints

## 11. Security Requirements

* All protected backend endpoints must validate Supabase JWTs.
* Authorization must be enforced on the backend only.
* Creator ownership must be checked on every session mutation.
* Sensitive routes should be rate limited.
* CORS must be explicitly configured.
* Secrets must remain in environment variables.
* Webhook endpoints must verify signatures if payments are added.

Supabase JWTs are designed for server-side validation, and their claims are documented for that purpose. ([Supabase][3])

## 12. Performance Requirements

* Session catalog queries should be paginated.
* Session detail pages should fetch only necessary fields.
* Creator dashboard queries should be scoped to the logged-in creator.
* Booking operations should avoid N+1 query patterns.
* Media URLs should be stored rather than binary data in PostgreSQL.

## 13. Deployment Requirements

### Containers

* `frontend`
* `backend`
* `postgres`
* `nginx`

### Optional Containers Later

* `redis`
* `minio`

### Runtime Expectations

* `docker compose up --build` must start the whole stack.
* Nginx should route browser traffic to the frontend and proxy API calls to Django if needed.
* PostgreSQL should be persistent across container restarts.

## 14. Bonus-Ready Extensions

### Payments

The booking model should be designed so payment state can be added later without schema rework.

### MinIO / S3

Store uploaded avatars and session images in object storage, not on the app container.

### Rate Limiting

Keep sensitive endpoints ready for throttling at either Nginx or DRF layer.

## 15. Observability and Developer Experience

* structured logging in backend
* clear `.env.example`
* API documentation via OpenAPI
* meaningful error messages
* clean README with setup and demo flow
* reasonable test coverage on business-critical flows

## 16. Implementation Boundaries

### Must Build

* Supabase client-side auth integration
* backend token verification
* public catalog
* session detail page
* booking flow
* user dashboard
* creator dashboard
* profile update
* Dockerized deployment

### Should Build

* search/filtering
* pagination
* polished empty/error states
* responsive Tailwind UI

### Nice to Have

* payments
* uploads
* rate limiting
* audit logs

If this direction looks right, I’ll turn it into the architecture diagrams next: system context, container, auth flow, booking flow, and deployment flow in Mermaid.

[1]: https://supabase.com/docs/guides/auth?utm_source=chatgpt.com "Auth | Supabase Docs"
[2]: https://www.django-rest-framework.org/api-guide/authentication/?utm_source=chatgpt.com "Authentication"
[3]: https://supabase.com/docs/guides/auth/jwts?utm_source=chatgpt.com "JSON Web Token (JWT) | Supabase Docs"
