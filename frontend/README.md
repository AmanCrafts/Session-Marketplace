# Sessions Marketplace — Frontend

The React + TypeScript + Tailwind client for Sessions Marketplace.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v3 (brand palette + utility components)
- React Router (data router)
- TanStack Query (caching, mutations, invalidation)
- Axios (with a Supabase JWT interceptor)
- React Hook Form + Zod (forms and validation)
- Supabase JS SDK (Google + GitHub OAuth)
- date-fns (dates), zustand (lightweight toast store)

## Project Layout

```
src/
  app/                 # providers, root App
  routes/              # router definition
  features/
    auth/              # AuthProvider, LandingPage, LoginPage, SignupPage, DashboardPage
    sessions/          # CatalogPage, SessionDetailPage, hooks, filters
    bookings/          # BookingsPage, hooks
    profile/           # ProfilePage, hooks
    creator/           # CreatorDashboard, list, form, bookings, apply/claim
  shared/
    api/               # Supabase client, axios + interceptors, typed API wrappers
    components/        # Button, Input, Card, Modal, Toaster, RouteGuards, etc.
    hooks/             # useToast and similar cross-cutting hooks
    layouts/           # AppLayout, PublicLayout, Navbar, Footer
    utils/             # format helpers
```

## Configuration

Copy `.env.example` to `.env` and fill in:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

- `VITE_API_BASE_URL` — Base URL of the Django backend API.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — From your Supabase project. Enable Google + GitHub providers in **Authentication → Providers** and add `${VITE_APP_URL}/auth/callback` to the redirect allow list.
- `VITE_APP_URL` — Where Supabase sends the browser after OAuth. In production this should match your public site URL.

The Axios request interceptor reads the current Supabase session, attaches `Authorization: Bearer <access_token>`, and the backend validates it. No tokens are stored in localStorage by the frontend.

## Scripts

```
npm install      # install
npm run dev      # start the dev server (Vite, port 5173)
npm run build    # type-check and produce a production bundle
npm run preview  # serve the production bundle locally
```

## Routes

| Path | Access |
| --- | --- |
| `/` | Public — landing |
| `/sessions` | Public — catalog |
| `/sessions/:id` | Public — session detail (Book gated for signed-out users) |
| `/login`, `/signup`, `/auth/callback` | Public — Supabase OAuth handshake |
| `/dashboard`, `/profile`, `/bookings` | Authenticated user |
| `/creator/apply`, `/creator/claim` | Authenticated (gating to creator) |
| `/creator`, `/creator/sessions`, `/creator/sessions/new`, `/creator/sessions/:id/edit`, `/creator/bookings` | Creator-only |

`ProtectedRoute` redirects signed-out users to `/login?next=…`; `CreatorRoute` redirects non-creators to `/creator/apply`.

## Auth Flow

1. The user clicks **Continue with Google/GitHub** on `/login` or `/signup`.
2. `signInWithOAuth` calls `@supabase/supabase-js`, which opens the provider, then bounces back to `${VITE_APP_URL}/auth/callback`.
3. `AuthProvider` listens to `onAuthStateChange`, exposes `session`, and `getMe()` is called automatically so role/identity are sourced from the backend.
4. Every authenticated request is enriched with `Authorization: Bearer <access_token>` by the Axios interceptor, and the backend validates the JWT through its `SupabaseJWTAuthentication` class.

## API Layer

The `shared/api` folder owns all I/O. Each file is a thin typed wrapper around an endpoint that matches `backend/<app>/<view>.py`:

- `auth.ts` — me, profile get/update, OAuth helper
- `sessions.ts` — public + creator session APIs
- `bookings.ts` — user + creator booking APIs
- `axios.ts` — Axios + `ApiError` envelope class
- `supabase.ts` — single `getSupabase()` lazy initializer
- `types.ts` — typed mirrors of backend serializers

## UI States

The app consistently handles:

- **loading** — skeleton grids + section-level spinners
- **empty** — friendly illustrations + primary action
- **error** — toast with backend-supplied message (`ApiError.describeError`)
- **success** — optimistic + toast + cache invalidation

## Build

```
npm run build
```

Output: `dist/` with split JS chunk + bundled CSS, ready for any static host or the Docker image.
