import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { classNames } from "../utils/format";

const PUBLIC_LINKS = [
  { to: "/sessions", label: "Browse sessions" },
];

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bookings", label: "My bookings" },
  { to: "/profile", label: "Profile" },
];

const CREATOR_LINKS = [
  { to: "/creator", label: "Creator hub" },
  { to: "/creator/sessions", label: "My sessions" },
  { to: "/creator/bookings", label: "Session bookings" },
];

export function Navbar() {
  const { ready, session, identity, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isCreator = identity?.user.is_creator ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h16v4H4z" />
            </svg>
          </span>
          <span className="text-base font-semibold text-slate-900">
            Sessions Marketplace
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                classNames(
                  "transition hover:text-slate-900",
                  isActive && "text-brand-700"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {session && USER_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                classNames(
                  "transition hover:text-slate-900",
                  isActive && "text-brand-700"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {session && isCreator && CREATOR_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                classNames(
                  "transition hover:text-slate-900",
                  isActive && "text-brand-700"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {ready && session && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar
                  src={undefined}
                  name={identity?.user.email || session.user.email || "You"}
                  size="sm"
                />
                <div className="text-right leading-tight">
                  <div className="text-xs font-semibold text-slate-700">
                    {identity?.user.email || session.user.email}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    {identity?.user.role ?? "user"}
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          )}
          {ready && !session && (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
