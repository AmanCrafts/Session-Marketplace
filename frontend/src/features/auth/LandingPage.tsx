import { Link } from "react-router-dom";
import { Container } from "../../shared/components/Container";
import { Button } from "../../shared/components/Button";

const FEATURES = [
  {
    title: "Discover curated sessions",
    body:
      "Browse a hand-picked catalog of live sessions across categories, difficulty levels, and price points.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "One-click booking",
    body:
      "Reserve your seat in seconds. Capacity is enforced server-side so the sessions you love stay intimate.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Creator-friendly tools",
    body:
      "Run your marketplace with structured listing, bookings and dashboards, all from a polished creator hub.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Secure by design",
    body:
      "OAuth-backed authentication with role-based permissions enforced on every protected endpoint.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
];

const CREATOR_BENEFITS = [
  "List free or paid sessions in minutes",
  "Capacity controls and draft / published / archived states",
  "See who is coming to your sessions with a clean bookings overview",
];

const USER_BENEFITS = [
  "Find sessions that match your interests with rich filters",
  "Avoid double-bookings — your bookings are tracked in one place",
  "Pick up where you left off with your personal dashboard",
];

export function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-gradient-to-b from-brand-100/50 to-transparent blur-3xl" />
        <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              New · Creator hub is live
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              The marketplace for{" "}
              <span className="bg-gradient-to-br from-brand-600 to-brand-400 bg-clip-text text-transparent">
                sessions worth your time
              </span>
              .
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Sessions Marketplace is where curious learners meet expert
              creators. Discover live learning opportunities, reserve your
              seat, and run your own.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/sessions" className="btn-primary">
                Browse sessions
              </Link>
              <Link to="/signup" className="btn-secondary">
                Start as a creator →
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>✓ No credit card to sign up</span>
              <span>✓ OAuth with Google or GitHub</span>
              <span>✓ Built for creators and learners</span>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-cardHover">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">
                    Upcoming
                  </div>
                  <div className="text-sm font-semibold">Designing APIs with Django</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Open
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400">When</div>
                  <div className="font-medium">Thu 7:00 PM</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Price</div>
                  <div className="font-medium">$25</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Format</div>
                  <div className="font-medium">Online · 60m</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Seats</div>
                  <div className="font-medium">21 / 50</div>
                </div>
              </div>
              <div className="mt-6 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[42%] rounded-full bg-brand-500" />
              </div>
              <Button className="mt-6 w-full" size="lg">
                Book this session
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* PRODUCT OVERVIEW */}
      <section className="bg-white">
        <Container className="py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">A polished marketplace for live learning</h2>
            <p className="mt-3 text-slate-600">
              One product, three flows: discovery for visitors, booking for
              users, and a creator hub for hosts. Everything is wired
              through a real OAuth-aware backend.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WHY */}
      <section className="bg-slate-50">
        <Container className="grid gap-12 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Why sessions, not courses?</h2>
            <p className="mt-3 text-slate-600">
              Long-form courses take weeks. Live sessions are an hour of
              focused attention with someone who already knows the
              landscape. We're building the place where those moments
              happen — and where creators get paid fairly for them.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
                Time-boxed, focused, and accountable.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
                Direct exposure to new creators and topics.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
                A marketplace model that scales for any subject.
              </li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <div className="text-3xl font-bold text-brand-600">10k+</div>
              <div className="mt-1 text-sm text-slate-500">
                Sessions ready to be discovered
              </div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-brand-600">120+</div>
              <div className="mt-1 text-sm text-slate-500">
                Independent creators hosting
              </div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-brand-600">98%</div>
              <div className="mt-1 text-sm text-slate-500">
                Bookings that resolve without a hitch
              </div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-brand-600">&lt;60s</div>
              <div className="mt-1 text-sm text-slate-500">
                Average time from discovery to booking
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* BENEFITS TWIN */}
      <section className="bg-white">
        <Container className="grid gap-8 py-16 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-8">
            <h3 className="text-2xl font-bold">For creators</h3>
            <p className="mt-2 text-slate-600">
              Publish once, manage bookings forever. Set your price, your
              capacity, and your schedule.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {CREATOR_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700">★</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-8">
            <h3 className="text-2xl font-bold">For learners</h3>
            <p className="mt-2 text-slate-600">
              Stop doom-scrolling long videos. Get the answer in an hour.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {USER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <Container className="flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to teach, learn, or both?
          </h2>
          <p className="max-w-xl text-slate-300">
            Sign in with the provider you already use. It takes a minute to
            sign up and there's nothing to install.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary">
              Create an account
            </Link>
            <Link
              to="/sessions"
              className="btn-secondary border-transparent bg-white/10 text-white hover:bg-white/20"
            >
              Browse the catalog
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
