/**
 * OAuth callback page.
 *
 * Supabase finishes the OAuth handshake via the URL fragment. By the time
 * the user lands here they already have a session, so we just bounce
 * them to the next destination.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { LoadingState } from "../../shared/components/Loading";

export function CallbackPage() {
  const { ready, session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    if (!ready) return;
    navigate(session ? next : "/login", { replace: true });
  }, [ready, session, navigate, next]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <LoadingState label="Finishing sign-in…" />
    </div>
  );
}
