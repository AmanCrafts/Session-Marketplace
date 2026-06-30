import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { PublicLayout } from "../shared/layouts/PublicLayout";
import { AppLayout } from "../shared/layouts/AppLayout";
import { ProtectedRoute, CreatorRoute } from "../shared/components/RouteGuards";
import { NotFoundPage } from "../shared/components/NotFound";
import { LandingPage } from "../features/auth/LandingPage";
import { LoginPage, SignupPage } from "../features/auth/AuthPages";
import { CallbackPage } from "../features/auth/CallbackPage";
import { DashboardPage } from "../features/auth/DashboardPage";
import { CatalogPage } from "../features/sessions/CatalogPage";
import { SessionDetailPage } from "../features/sessions/SessionDetailPage";
import { BookingsPage } from "../features/bookings/BookingsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { CreatorApplyPage } from "../features/creator/CreatorApplyPage";
import { CreatorClaimPage } from "../features/creator/CreatorClaimPage";
import { CreatorDashboardPage } from "../features/creator/CreatorDashboardPage";
import { CreatorSessionsPage } from "../features/creator/CreatorSessionsPage";
import {
  SessionCreatePage,
  SessionEditPage,
} from "../features/creator/SessionFormPage";
import { CreatorBookingsPage } from "../features/creator/CreatorBookingsPage";

function SessionDetailWrapper() {
  const { id } = useParams();
  return <SessionDetailPage sessionId={id ?? ""} />;
}

function SessionEditWrapper() {
  useParams();
  return <SessionEditPage />;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/auth/callback", element: <CallbackPage /> },
      { path: "/sessions", element: <CatalogPage /> },
      { path: "/sessions/:id", element: <SessionDetailWrapper /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/bookings",
        element: (
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/creator",
        element: (
          <CreatorRoute>
            <CreatorDashboardPage />
          </CreatorRoute>
        ),
      },
      {
        path: "/creator/sessions",
        element: (
          <CreatorRoute>
            <CreatorSessionsPage />
          </CreatorRoute>
        ),
      },
      {
        path: "/creator/sessions/new",
        element: (
          <CreatorRoute>
            <SessionCreatePage />
          </CreatorRoute>
        ),
      },
      {
        path: "/creator/sessions/:id/edit",
        element: (
          <CreatorRoute>
            <SessionEditWrapper />
          </CreatorRoute>
        ),
      },
      {
        path: "/creator/bookings",
        element: (
          <CreatorRoute>
            <CreatorBookingsPage />
          </CreatorRoute>
        ),
      },
      {
        path: "/creator/apply",
        element: (
          <ProtectedRoute>
            <CreatorApplyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/creator/claim",
        element: (
          <ProtectedRoute>
            <CreatorClaimPage />
          </ProtectedRoute>
        ),
      },
      { path: "/404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
