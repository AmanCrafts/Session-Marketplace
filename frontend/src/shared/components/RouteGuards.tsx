import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { Spinner } from "./Loading";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

export function CreatorRoute({ children }: { children: ReactNode }) {
  const { ready, session, identity } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!identity?.user.is_creator) {
    return <Navigate to="/creator/apply" replace />;
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  if (!ready) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
