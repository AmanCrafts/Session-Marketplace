import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { Container } from "../../shared/components/Container";
import { useAuth } from "./useAuth";
import { isSupabaseConfigured } from "../../shared/api/supabase";
import { signInWithOAuth } from "../../shared/api/auth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 7.5 29 5.7 24 5.7 13.8 5.7 5.7 13.8 5.7 24S13.8 42.3 24 42.3 42.3 34.2 42.3 24c0-1.3-.1-2.4-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 7.5 29 5.7 24 5.7 16.2 5.7 9.6 9.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 42.3c4.9 0 9.3-1.9 12.5-5.1l-5.8-4.9c-2 1.6-4.5 2.5-6.7 2.5-5.3 0-9.8-3.5-11.4-8.3l-6.5 5C9.4 38.7 16.1 42.3 24 42.3z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l5.8 4.9c-.4.4 6.7-4.9 6.7-14.6 0-1.3-.1-2.4-.3-3.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.5-5.3 5.8.4.4.8 1 .8 2.1v3.1c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

interface OAuthButtonProps {
  provider: "google" | "github";
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

function OAuthButton({ provider, onClick, loading, children }: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      <span>{children}</span>
    </button>
  );
}

function AuthMessage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Supabase isn't configured. Add <code>VITE_SUPABASE_URL</code> and
        <code className="ml-1">VITE_SUPABASE_ANON_KEY</code> to your .env
        and restart the dev server.
      </div>
    );
  }
  return null;
}

export function LoginPage() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/dashboard";
  const [pending, setPending] = useState<"google" | "github" | null>(null);

  useEffect(() => {
    if (session) navigate(next, { replace: true });
  }, [session, navigate, next]);

  const handle = async (provider: "google" | "github") => {
    try {
      setPending(provider);
      await signInWithOAuth(provider);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(null);
    }
  };

  return (
    <Container className="grid min-h-[80vh] place-items-center py-12">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage your bookings or creator hub.
          </p>
        </div>
        <AuthMessage />
        <div className="mt-4 space-y-3">
          <OAuthButton
            provider="google"
            onClick={() => handle("google")}
            loading={pending === "google"}
          >
            Continue with Google
          </OAuthButton>
          <OAuthButton
            provider="github"
            onClick={() => handle("github")}
            loading={pending === "github"}
          >
            Continue with GitHub
          </OAuthButton>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </Container>
  );
}

export function SignupPage() {
  return (
    <Container className="grid min-h-[80vh] place-items-center py-12">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign up to discover, book, or host your first session.
          </p>
        </div>
        <AuthMessage />
        <div className="mt-4 space-y-3">
          <OAuthButton provider="google" onClick={() => signInWithOAuth("google")}>
            Sign up with Google
          </OAuthButton>
          <OAuthButton provider="github" onClick={() => signInWithOAuth("github")}>
            Sign up with GitHub
          </OAuthButton>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </Container>
  );
}
