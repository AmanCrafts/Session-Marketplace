## 1) Product Requirements (PRD)

## 1.1 Product Overview

Sessions Marketplace is a web application where users can sign in via OAuth, browse public sessions, and book attendance. Creators can publish and manage their own sessions, while regular users can explore the catalog, make bookings, and track upcoming and past bookings.

The product is designed as a polished marketplace with a professional SaaS-style structure. The primary goal is to demonstrate end-to-end engineering capability across frontend, backend, database design, authentication, containerized deployment, and documentation.

## 1.2 Problem Statement

Many session-based platforms are either too simplistic for creators or too fragmented for users. Users need a clean way to discover and book sessions. Creators need a structured dashboard to publish sessions, manage availability, and review bookings. The application should provide a secure OAuth-based login flow, enforce role-based access, and remain easy to deploy and evaluate.

## 1.3 Product Goals

* Allow users to authenticate using Google or GitHub OAuth.
* Issue backend-managed JWTs after OAuth verification.
* Support two roles: User and Creator.
* Provide a public catalog of sessions that is easy to browse and filter.
* Enable session booking with clear status tracking.
* Provide user and creator dashboards.
* Support profile viewing and basic profile updates.
* Be fully runnable through Docker Compose with a single command.
* Include room for bonus features such as payments, file uploads, and rate limiting.

## 1.4 Non-Goals

* No native mobile app.
* No microservices architecture.
* No real-time chat or live video hosting.
* No complex recommendation engine.
* No admin CMS beyond the creator dashboard and Django admin for internal operations.
* No multi-organization enterprise tenancy.

## 1.5 Target Users

### User

A person who wants to discover sessions, book them, and manage their bookings.

### Creator

A person who wants to create sessions, manage listings, and view booking activity.


## 1.6 Assumptions

* Authentication is handled through Google or GitHub OAuth.
* The backend is the source of truth for app authentication after the OAuth handshake.
* Sessions are owned by creators.
* Bookings are tied to authenticated users.
* A session may be free or paid.
* Sessions can be published or unpublished.
* A creator can manage only sessions they own.
* Booking capacity is enforced server-side.
* Frontend is client-side only and uses Tailwind CSS for styling.

## 1.7 Scope

The product is scoped to a marketplace for discoverable sessions with booking and management workflows.

### In Scope

* OAuth login via Google or GitHub.
* Backend-issued JWT authentication.
* Role-based access control.
* Public session catalog.
* Session details page.
* Booking creation and booking history.
* Creator session CRUD.
* Creator booking overview.
* Profile view and update.
* Dockerized deployment.
* Nginx reverse proxy.
* PostgreSQL persistence.
* Bonus-ready architecture for payments, uploads, and rate limiting.

### Out of Scope

* Direct messaging between users and creators.
* Calendar synchronization.
* In-app notifications or email workflows.
* Video conferencing integration.
* Search indexing with external engines.

## 1.8 Core User Journeys

### Journey A: Anonymous Visitor Browses Sessions

1. Visitor lands on the home page.
2. Visitor views featured or published sessions.
3. Visitor opens session detail pages.
4. Visitor is prompted to log in when attempting to book.

### Journey B: User Logs In and Books a Session

1. User selects Google or GitHub login.
2. OAuth provider authenticates the user.
3. Backend verifies the OAuth identity and issues JWTs.
4. User browses sessions.
5. User opens a session detail page and books it.
6. Booking appears in the user dashboard.

### Journey C: Creator Manages Sessions

1. Creator logs in through OAuth.
2. Backend assigns or resolves creator role.
3. Creator opens the creator dashboard.
4. Creator creates or edits sessions.
5. Creator views bookings for owned sessions.

### Journey D: User Updates Profile

1. User opens profile page.
2. User updates display name or avatar.
3. Backend validates and saves changes.
4. Updated profile data is reflected in the UI.

## 1.9 Functional Requirements

### Authentication and Roles

* Users must be able to sign in with Google or GitHub OAuth.
* Backend must verify OAuth identity before issuing JWTs.
* Application must support two roles: User and Creator.
* Role-based permissions must be enforced on protected endpoints.
* Users must be able to sign out locally.
* JWT access and refresh token flow must be supported.

### Profile Management

* Authenticated users must be able to view their profile.
* Users must be able to update basic profile fields such as name and avatar.
* Profile data must be stored in the backend database.

### Session Catalog

* All visitors must be able to browse published sessions.
* Sessions must display title, creator, price, category, duration, date/time, capacity, and booking availability.
* Session detail pages must show complete session metadata.
* Sessions may include tags, difficulty level, and status.

### Booking Flow

* Authenticated users must be able to book a session.
* The backend must prevent overbooking.
* Booking status must be tracked.
* Users must be able to view active and past bookings.
* Users must not book the same session multiple times if business rules disallow duplicates.

### Creator Dashboard

* Creators must be able to create new sessions.
* Creators must be able to edit and delete their own sessions.
* Creators must be able to publish or unpublish sessions.
* Creators must be able to review bookings for their sessions.
* Creators must not manage sessions owned by other creators.

### Public Experience

* Home page must present the session marketplace clearly.
* The UI must be responsive and usable on common viewport sizes.
* The UI must show loading, empty, and error states.
* The UI must guide the user to authenticate when required.

### Bonus-Ready Features

* Payment integration must be possible without redesigning the booking model.
* File upload support must be possible for session images and avatars.
* Rate limiting must be applicable to sensitive routes.

## 1.10 Non-Functional Requirements

### Security

* OAuth identities must be verified server-side.
* JWTs must be signed and validated securely.
* Protected APIs must reject unauthorized access.
* Sensitive endpoints must be protected against abuse.
* Ownership checks must be enforced on creator actions.

### Reliability

* The system should fail gracefully when external OAuth or payment services are unavailable.
* Booking operations must be transaction-safe.
* The application should prevent inconsistent booking state.

### Performance

* Session catalog pages should load quickly with paginated or optimized queries.
* API responses should be efficient and predictable.
* Frontend should minimize unnecessary re-renders.

### Maintainability

* Code should be organized by feature and responsibility.
* Backend logic should be separated into views, serializers, services, and permissions.
* API contracts should be documented.
* Environment variables should be centralized in `.env.example`.

### Portability

* The full system must run through Docker Compose.
* The app must be reproducible on a clean machine with minimal setup.

### Usability

* The frontend should be clean, modern, and responsive.
* Tailwind CSS should be used consistently for styling.
* Error states and empty states should be clear.

## 1.11 Success Criteria

* A reviewer can run the project with `docker compose up --build`.
* OAuth login works and issues backend JWTs.
* Role-based routes behave correctly.
* Users can browse sessions and book them.
* Creators can manage only their own sessions.
* User and creator dashboards show the expected data.
* Documentation is sufficient for setup and evaluation.
* Bonus-ready architecture is visible in the codebase and design.

## 1.12 Recommended Feature Set for the Assignment

To make the project feel complete without overcomplicating implementation, the recommended baseline feature set is:

* OAuth login with backend JWT issuance.
* Public catalog with search/filter/pagination.
* Session detail view.
* Booking creation and booking lists.
* Creator CRUD for sessions.
* Profile update.
* Tailwind-styled responsive frontend.
* Dockerized deployment with Nginx and PostgreSQL.
* Optional placeholders or interfaces for payments and uploads.

## 1.13 Product Principles

* Secure by default.
* Simple to evaluate.
* Modular enough to scale.
* User flows should be obvious.
* Creator flows should be ownership-aware.
* Optional features should be architecturally natural, not bolted on.

