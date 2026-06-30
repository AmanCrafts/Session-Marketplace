# Sessions Marketplace — Architecture

This document captures the full system architecture for the Sessions Marketplace application. It covers the system context, application containers, frontend and backend structure, authentication and authorization flows, booking workflows, database design, deployment topology, and the core state transitions that define the application behavior.

---

## 1. Architectural Principles

- Modular monolith on the backend
- Client-side authentication via Supabase Auth
- Backend-owned authorization and business rules
- Frontend client-only React application with Tailwind CSS
- Containerized deployment using Docker Compose
- Clear ownership boundaries between User, Creator, and session resources
- Bonus-ready design for payments, object storage, and rate limiting

---

## 2. High-Level System Context

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Visitor["Anonymous Visitor / User / Creator"] --> FE["React SPA<br>Tailwind CSS"]
    FE --> SB["Supabase Auth"] & NG["Nginx Reverse Proxy"]
    NG --> API["Django REST API"]
    API --> DB[("PostgreSQL")] & SB & PAY["Stripe / Razorpay<br>Optional"] & OBJ["MinIO / S3<br>Optional"]
```

### Context Notes

- The browser interacts with the React frontend.
- Supabase Auth handles login, logout, and session issuance.
- The frontend sends Supabase access tokens to the backend in the `Authorization` header.
- The backend validates the token, authorizes the request, and executes business logic.
- PostgreSQL is the persistent source of truth for application data.

---

## 3. Container Architecture

```mermaid
---
config:
    layout: dagre
---
flowchart TB
    subgraph Client["Client Layer"]
            Browser["Browser"]
            React["React SPA"]
    end
    subgraph Edge["Edge Layer"]
            Nginx["Nginx Reverse Proxy"]
    end
    subgraph App["Application Layer"]
            Django["Django + DRF"]
            Auth["Supabase JWT Verification"]
            Accounts["accounts"]
            Profiles["profiles"]
            Sessions["sessions"]
            Bookings["bookings"]
            Payments["payments optional"]
            Storage["storage optional"]
    end
    subgraph Data["Data Layer"]
            Postgres[("PostgreSQL")]
    end
    subgraph External["External Services"]
            Supabase["Supabase Auth"]
            Stripe["Stripe / Razorpay optional"]
            MinIO["MinIO / S3 optional"]
    end
        Browser --> React
        React --> Supabase & Nginx
        Nginx --> Django
        Django --> Auth & Accounts & Profiles & Sessions & Bookings & Payments & Storage & Postgres & Stripe & MinIO
```

### Container Responsibilities

#### React SPA

- Renders the UI
- Manages Supabase session state
- Sends authenticated API requests
- Handles route-level protection in the UI
- Uses Tailwind CSS for styling

#### Nginx

- Serves as reverse proxy
- Routes frontend and backend traffic
- Can host static build output if desired
- Can later enforce rate limiting rules

#### Django + DRF

- Validates Supabase JWTs
- Enforces authorization and ownership rules
- Handles all business logic
- Persists data to PostgreSQL
- Exposes REST APIs

#### PostgreSQL

- Stores users, profiles, sessions, bookings, tags, images, and optional payment records

#### Supabase Auth

- Performs OAuth sign-in with Google or GitHub
- Issues session tokens for the frontend

---

## 4. Frontend Architecture

```mermaid
---
config:
  layout: dagre
---
flowchart TB
    App["React App"] --> Router["Routing Layer"] & AuthProvider["Supabase Auth Provider"] & Query["Data Fetching Layer<br>TanStack Query"] & Forms["Form Layer<br>React Hook Form + Zod"] & UI["UI Components<br>Tailwind CSS"] & State["Local State / Zustand optional"]
```

### Frontend Feature Structure

```mermaid
flowchart TB
    Src[src/]
    AppDir[app/ or routes/]
    Auth[features/auth]
    Sesh[features/sessions]
    Book[features/bookings]
    Prof[features/profile]
    Creat[features/creator]
    Shared[shared/]
    Layouts[layouts/]

    Src --> AppDir
    Src --> Auth
    Src --> Sesh
    Src --> Book
    Src --> Prof
    Src --> Creat
    Src --> Shared
    Src --> Layouts
```

### Frontend Route Map

```mermaid
---
config:
  layout: elk
---
flowchart TD
    Home[/Home / Catalog/]
    Detail[/Session Detail/]
    Login[/Login / OAuth Redirect/]
    UserDash[/User Dashboard/]
    CreatorDash[/Creator Dashboard/]
    Profile[/Profile/]
    NotFound[/404/]

    Home --> Detail
    Home --> Login
    Home --> UserDash
    Home --> CreatorDash
    UserDash --> Profile
    CreatorDash --> Profile
    Detail --> Login
```

### Frontend Responsibilities by Page

#### Home / Catalog

- Lists published sessions
- Supports filtering, search, and pagination
- Displays login CTA

#### Session Detail

- Shows complete session information
- Presents booking action
- Displays creator details and availability

#### User Dashboard

- Shows active bookings
- Shows past bookings
- Shows profile summary

#### Creator Dashboard

- Lists owned sessions
- Shows booking overview
- Provides CRUD actions for sessions

#### Profile Page

- Shows name and avatar
- Allows profile updates

---

## 5. Authentication Architecture

### Auth Model

- Authentication is handled by Supabase Auth on the client side
- The backend does not perform OAuth login directly
- The backend validates the Supabase access token on every protected request
- Authorization and business logic remain fully backend-owned

### Auth Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React as React App
    participant Supabase as Supabase Auth
    participant API as Django API
    participant DB as PostgreSQL

    User->>React: Click Google/GitHub login
    React->>Supabase: Start OAuth flow
    Supabase-->>React: Session + access token
    React->>API: Send request with Bearer token
    API->>API: Verify token signature and claims
    API->>DB: Load or create local user record
    DB-->>API: User + role data
    API-->>React: Authorized response
```

### Backend Authentication Rules

- Reject requests without a Bearer token
- Reject expired or invalid tokens
- Map the authenticated subject to a local user record
- Never trust frontend role claims alone
- Use backend-stored roles for authorization decisions

### Request Authorization Decision Tree

```mermaid
flowchart TD
    A[Incoming API Request] --> B{Bearer token present?}
    B -- No --> R1[401 Unauthorized]
    B -- Yes --> C[Validate Supabase JWT]
    C --> D{Token valid?}
    D -- No --> R1
    D -- Yes --> E[Resolve local user]
    E --> F{Protected creator route?}
    F -- No --> G[Allow authenticated user access]
    F -- Yes --> H{Role = Creator?}
    H -- No --> R2[403 Forbidden]
    H -- Yes --> I{Owns resource?}
    I -- No --> R2
    I -- Yes --> J[Allow business operation]
```

---

## 6. Backend Architecture

### Backend Layer Stack

```mermaid
---
config:
  layout: elk
---
flowchart LR
    Request[HTTP Request] --> Middleware[Middleware / CORS / Auth Header]
    Middleware --> AuthN[JWT Authentication]
    AuthN --> Perm[Permissions]
    Perm --> Serializer[Serializer Validation]
    Serializer --> Service[Service Layer]
    Service --> ORM[Django ORM]
    ORM --> DB[(PostgreSQL)]
    DB --> ORM
    ORM --> Service
    Service --> Response[Response Builder]
    Response --> Reply[HTTP Response]
```

### Backend App Modules

```mermaid
flowchart TB
    Project[backend/]
    Common[common]
    Accounts[accounts]
    Profiles[profiles]
    Sessions[sessions]
    Bookings[bookings]
    Payments[payments optional]
    Storage[storage optional]

    Project --> Common
    Project --> Accounts
    Project --> Profiles
    Project --> Sessions
    Project --> Bookings
    Project --> Payments
    Project --> Storage
```

### Responsibilities of Each Backend App

#### common

- shared utilities
- base exceptions
- common response helpers
- base model mixins

#### accounts

- local user record handling
- Supabase identity mapping
- role resolution

#### profiles

- profile view/update
- avatar metadata management

#### sessions

- session CRUD
- publishing state
- search/filter logic
- creator ownership rules

#### bookings

- booking creation
- cancellation
- booking history
- capacity validation
- duplicate booking rules

#### payments optional

- payment intent lifecycle
- payment confirmation
- webhook processing

#### storage optional

- image upload abstraction
- storage provider integration

---

## 7. API Surface

### Public APIs

- `GET /api/sessions`
- `GET /api/sessions/:id`

### Authenticated User APIs

- `GET /api/me`
- `PATCH /api/me`
- `GET /api/bookings/me`
- `POST /api/bookings`

### Creator APIs

- `GET /api/creator/sessions`
- `POST /api/creator/sessions`
- `PATCH /api/creator/sessions/:id`
- `DELETE /api/creator/sessions/:id`
- `GET /api/creator/bookings`

### Optional Payments APIs

- `POST /api/payments/create-intent`
- `POST /api/payments/webhook`

### API Design Rules

- RESTful naming
- predictable response shapes
- pagination for list endpoints
- filtering for catalog endpoints
- ownership checks on creator endpoints
- authorization enforced server-side only

---

## 8. Booking Architecture

### Booking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React as React App
    participant API as Django API
    participant DB as PostgreSQL

    User->>React: Open session detail
    React->>API: GET /api/sessions/:id
    API->>DB: Fetch session record
    DB-->>API: Session details
    API-->>React: Session payload

    User->>React: Click Book Now
    React->>API: POST /api/bookings with Bearer token
    API->>API: Verify token and permissions
    API->>DB: Begin transaction
    API->>DB: Check capacity and duplicate rules
    API->>DB: Insert booking record
    API->>DB: Update counters or availability state
    DB-->>API: Transaction committed
    API-->>React: Booking confirmation
```

### Booking Rules

- Only authenticated users can book
- Session capacity must never be exceeded
- Duplicate booking rules must be enforced
- Booking creation must be transactional
- Users can view active and past bookings
- Creators can view bookings only for sessions they own

### Booking State Machine

```mermaid
---
config:
  layout: elk
---
stateDiagram-v2
    [*] --> Pending
    Pending --> Confirmed
    Pending --> Canceled
    Pending --> Failed
    Confirmed --> Canceled
    Confirmed --> Refunded
    Canceled --> [*]
    Failed --> [*]
    Refunded --> [*]
```

---

## 9. Session Architecture

### Session Lifecycle

```mermaid
---
config:
  layout: elk
---
stateDiagram
  direction LR
  [*] --> Draft
  Published --> Unpublished
  [*] --> Archived
  Draft --> Published
  Unpublished --> Published
  Published --> Archived
  Draft --> Unpublished
  Unpublished --> Archived
  Published --> [*]
```

### Session Management Flow

```mermaid
---
config:
  layout: elk
---
flowchart LR
    A["Creator opens dashboard"] --> B["Fetch owned sessions"]
    B --> C{"Create or Edit?"}
    C -- Create --> D["Validate payload"]
    C -- Edit --> E["Load session by id"]
    E --> F{"Owns session?"}
    F L_F_X_0@-- No --> X["403 Forbidden"]
    F -- Yes --> G["Validate payload"]
    D --> H["Save session changes"]
    G --> H
    H --> I["Return updated session"]

```

### Session Fields

- title
- description
- category
- difficulty
- duration
- price
- currency if needed
- capacity
- scheduled date/time
- location type
- status
- tags
- thumbnail
- gallery images optional
- creator reference

---

## 10. Database Architecture

### Database ER Diagram

```mermaid
---
config:
  layout: elk
---
erDiagram
    direction LR

    APP_USER ||--|| PROFILE : has
    APP_USER ||--o{ SESSION : creates
    APP_USER ||--o{ BOOKING : makes

    SESSION ||--o{ BOOKING : receives
    SESSION ||--o{ SESSION_TAG : has
    TAG ||--o{ SESSION_TAG : maps
    SESSION ||--o{ SESSION_IMAGE : contains

    BOOKING ||--o| PAYMENT : has

    APP_USER {
        uuid id PK
        uuid supabase_user_id
        string email
        string role
        datetime created_at
        datetime updated_at
    }

    PROFILE {
        uuid id PK
        uuid app_user_id FK
        string full_name
        string avatar_url
        string bio
        datetime created_at
        datetime updated_at
    }

    SESSION {
        uuid id PK
        uuid creator_id FK
        string title
        text description
        string category
        string difficulty
        integer duration_minutes
        decimal price
        string currency
        integer capacity
        datetime scheduled_at
        string location_type
        string status
        string thumbnail_url
        datetime created_at
        datetime updated_at
    }

    BOOKING {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string status
        datetime booked_at
        datetime canceled_at
        decimal amount_paid
        string payment_status
        datetime created_at
        datetime updated_at
    }

    TAG {
        uuid id PK
        string name
        datetime created_at
    }

    SESSION_TAG {
        uuid id PK
        uuid session_id FK
        uuid tag_id FK
    }

    SESSION_IMAGE {
        uuid id PK
        uuid session_id FK
        string image_url
        integer sort_order
        datetime created_at
    }

    PAYMENT {
        uuid id PK
        uuid booking_id FK
        string provider
        string provider_payment_id
        string status
        decimal amount
        string currency
        datetime created_at
    }

```

### Table Purpose Summary

#### USER

Stores the local application identity and role. The `supabase_user_id` links the local record to the Supabase Auth subject.

#### PROFILE

Stores display name, avatar, and optional bio.

#### OAUTH_ACCOUNT

Stores external identity-provider linkage if multiple providers are tracked explicitly.

#### SESSION

Stores marketplace session listings created by creators.

#### BOOKING

Stores user bookings for sessions.

#### TAG

Stores reusable labels for sessions.

#### SESSION_TAG

Maps many-to-many associations between sessions and tags.

#### SESSION_IMAGE

Stores session gallery images or media references.

#### PAYMENT

Stores payment lifecycle data when the bonus feature is enabled.

### Database Design Rules

- Use UUID primary keys
- Enforce foreign keys for relational integrity
- Enforce creator ownership through foreign key relations and backend checks
- Use unique constraints where appropriate, such as provider subject or session-user uniqueness
- Keep binary file data out of PostgreSQL; store only references

---

## 11. Authorization Architecture

### Authorization Layers

1. Token validation
2. Identity resolution
3. Role check
4. Ownership check
5. Business rule check

### Authorization Flow

```mermaid
---
config:
  layout: elk
---
flowchart LR
    A["Request arrives"] --> B["Validate Supabase JWT"]
    B --> C["Resolve local user"]
    C --> D{"Is endpoint protected?"}
    D -- No --> Z["Allow"]
    D -- Yes --> E{"Requires Creator role?"}
    E -- No --> F["Check authenticated user"]
    E -- Yes --> G{"Role = Creator?"}
    G -- No --> X["403"]
    G -- Yes --> H{"Owns target resource?"}
    H -- No --> X
    H -- Yes --> I["Run business logic"]
    F --> I
```

---

## 12. Deployment Architecture

### Deployment Diagram

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Browser[Browser]
    Nginx[Nginx Reverse Proxy]
    Frontend[Frontend Container<br/>React Build / Static Assets]
    Backend[Backend Container<br/>Django + DRF + Gunicorn]
    Postgres[(PostgreSQL Container)]
    Supabase[Supabase Auth Cloud]
    MinIO[MinIO / S3 Optional]
    Payments[Stripe / Razorpay Optional]

    Browser --> Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Frontend --> Supabase
    Backend --> Postgres
    Backend --> Supabase
    Backend --> MinIO
    Backend --> Payments
```

### Docker Compose Topology

- `frontend`
- `backend`
- `postgres`
- `nginx`

### Runtime Requirement

- One command must bring the system up:
  - `docker compose up --build`

### Deployment Rules

- Environment variables must be externalized
- Nginx should be the entry point
- Backend should not depend on manual local setup
- PostgreSQL data should persist across container restarts

---

## 13. Security Architecture

### Security Controls

- Validate JWTs on every protected backend request
- Do not trust client-side role flags
- Enforce creator ownership on update/delete operations
- Protect sensitive endpoints with rate limiting
- Verify webhook signatures for payment callbacks
- Keep secrets in environment variables only
- Configure CORS explicitly

### Request Security Pipeline

```mermaid
flowchart LR
    Req[HTTP Request] --> Proxy[Nginx]
    Proxy --> Auth[JWT Validation]
    Auth --> CORS[CORS Check]
    CORS --> Perm[Permission Check]
    Perm --> Own[Ownership Check]
    Own --> Biz[Business Logic]
    Biz --> DB[(PostgreSQL)]
```

---

## 14. Optional Feature Architecture

### Payments

The booking workflow should support a later transition to paid bookings without redesigning the booking model.

```mermaid
flowchart LR
    A[Create booking] --> B{Paid session?}
    B -- No --> C[Confirm booking immediately]
    B -- Yes --> D[Create payment intent]
    D --> E[Complete payment]
    E --> F[Mark payment confirmed]
    F --> G[Confirm booking]
```

### MinIO / S3 Uploads

Use object storage for avatars and session images.

```mermaid
---
config:
    layout: elk
---
flowchart LR
    UI[Frontend] --> API[Django API]
    API --> Store[MinIO / S3]
    Store --> API
    API --> DB[(PostgreSQL stores URL only)]
```

### Rate Limiting

Sensitive endpoints such as login-related or booking-related endpoints should be protected.

```mermaid
flowchart LR
    Client[Client] --> Nginx[Nginx]
    Nginx --> RL[Rate Limit Check]
    RL --> API[Django API]
```

---

## 15. Observability and Quality Architecture

### Logging

- structured backend logs
- request id correlation if possible
- error logs for failed booking attempts
- audit logs for creator mutations if added later

### Validation

- serializer-level input validation
- frontend form validation with Zod
- business validation in service layer

### API Documentation

- OpenAPI schema generation for all endpoints
- documented request/response payloads

### Testing Focus

- auth token validation
- booking capacity enforcement
- creator ownership checks
- session publish/unpublish logic
- profile update flow

---

## 16. Recommended File-Level Architecture

```mermaid
flowchart TB
    Root[project-root/]
    Docs[docs/]
    Frontend[frontend/]
    Backend[backend/]
    Infra[infra/]
    NginxConf[nginx/]

    Root --> Docs
    Root --> Frontend
    Root --> Backend
    Root --> Infra
    Root --> NginxConf
```

### Suggested Documentation Files

- `PRD.md`
- `TRD.md`
- `Architecture.md`
- `API.md`
- `DATABASE.md`
- `SECURITY.md`
- `README.md`

### Suggested Diagram Files if Split Later

- `system-context.mmd`
- `container.mmd`
- `auth-flow.mmd`
- `booking-flow.mmd`
- `deployment.mmd`
- `erd.mmd`

---

## 17. Summary

This architecture is intentionally designed to look and behave like a real production system while remaining achievable within an assignment timeline.

It provides:

- a clean React + Tailwind frontend
- Supabase-based client authentication
- backend-enforced authorization and business logic
- a PostgreSQL-backed data model
- Dockerized deployment
- Mermaid diagrams for the full system
- room for payments, object storage, and rate limiting without redesign