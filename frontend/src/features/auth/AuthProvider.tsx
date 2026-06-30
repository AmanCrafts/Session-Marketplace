import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, isSupabaseConfigured } from "../../shared/api/supabase";
import type { MeResponse } from "../../shared/api/types";
import { getMe, signOut as apiSignOut } from "../../shared/api/auth";
import type { Session as SupabaseSession, User } from "@supabase/supabase-js";

interface AuthState {
  ready: boolean;
  configured: boolean;
  user: User | null;
  session: SupabaseSession | null;
  identity: MeResponse | null;
}

interface AuthContextValue extends AuthState {
  refreshIdentity: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    configured: isSupabaseConfigured,
    user: null,
    session: null,
    identity: null,
  });

  // Subscribe to Supabase auth events so the session reflects logins,
  // logouts, and token refreshes throughout the app.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({ ...s, ready: true }));
      return;
    }
    const supabase = getSupabase();

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState((s) => ({
        ...s,
        ready: true,
        user: data.session?.user ?? null,
        session: data.session,
      }));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        ready: true,
        user: session?.user ?? null,
        session,
      }));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!state.session) {
      setState((s) => ({ ...s, identity: null }));
      return;
    }
    try {
      const identity = await getMe();
      setState((s) => ({ ...s, identity }));
    } catch {
      // 401 means the Supabase token isn't accepted by the backend yet —
      // silently clear identity; the app will treat the user as logged-out
      // until a valid token comes back through.
      setState((s) => ({ ...s, identity: null }));
    }
  }, [state.session]);

  // Whenever a session appears, fetch the backend identity so the role is
  // resolved from backend-owned data, not the JWT.
  useEffect(() => {
    if (!state.ready) return;
    if (!state.session) {
      setState((s) => ({ ...s, identity: null }));
      return;
    }
    refreshIdentity();
  }, [state.ready, state.session, refreshIdentity]);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } finally {
      setState((s) => ({
        ...s,
        user: null,
        session: null,
        identity: null,
      }));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refreshIdentity, signOut }),
    [state, refreshIdentity, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
