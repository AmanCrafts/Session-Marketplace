import { Link } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { PageHeader } from "../../shared/components/PageHeader";
import { Avatar } from "../../shared/components/Avatar";
import { Badge } from "../../shared/components/Badge";
import { useCreatorSessions } from "../sessions/useSessions";
import { useCreatorBookings } from "../bookings/useBookings";
import { useAuth } from "../auth/useAuth";
import {
  formatDateTime,
  formatCurrency,
  pluralize,
} from "../../shared/utils/format";

export function CreatorDashboardPage() {
  const { identity } = useAuth();
  const { data: sessions } = useCreatorSessions({ page_size: 5 });
  const { data: bookings } = useCreatorBookings({ page_size: 5 });

  const sessionResults = sessions?.results ?? [];
  const bookingResults = bookings?.results ?? [];

  const totalBookings = bookings?.count ?? 0;
  const totalSessions = sessions?.count ?? 0;
  const publishedCount = sessionResults.filter(
    (s) => s.status === "published"
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Creator hub"
        title="Welcome, creator"
        description="Run your listings, track your bookings, and ship a new session in minutes."
        action={
          <Link to="/creator/sessions/new" className="btn-primary">
            + New session
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Sessions
          </div>
          <div className="mt-1 text-3xl font-bold">{totalSessions}</div>
          <div className="mt-1 text-xs text-slate-500">
            {publishedCount} published
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Bookings (all time)
          </div>
          <div className="mt-1 text-3xl font-bold">{totalBookings}</div>
          <div className="mt-1 text-xs text-slate-500">
            From {sessionResults.length} recent sessions
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Profile
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Avatar
              src={undefined}
              name={identity?.user.email || "Creator"}
              size="md"
            />
            <div className="text-sm">
              <Badge tone="info">creator</Badge>
              <p className="mt-1 text-xs text-slate-500 truncate">
                {identity?.user.email}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">My recent sessions</h2>
            <Link to="/creator/sessions" className="text-sm text-brand-700 hover:underline">
              Manage all →
            </Link>
          </div>
          {sessionResults.length === 0 ? (
            <p className="text-sm text-slate-500">
              You haven't created any sessions yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessionResults.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/creator/sessions/${s.id}/edit`}
                      className="truncate font-medium hover:text-brand-700"
                    >
                      {s.title}
                    </Link>
                    <div className="truncate text-xs text-slate-500">
                      {s.scheduled_at ? formatDateTime(s.scheduled_at) : "TBD"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      tone={
                        s.status === "published"
                          ? "success"
                          : s.status === "draft"
                          ? "info"
                          : "default"
                      }
                    >
                      {s.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {pluralize(s.bookings_count, "booking")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent bookings</h2>
            <Link
              to="/creator/bookings"
              className="text-sm text-brand-700 hover:underline"
            >
              See all →
            </Link>
          </div>
          {bookingResults.length === 0 ? (
            <p className="text-sm text-slate-500">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bookingResults.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{b.session.title}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(b.booked_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      tone={
                        b.status === "confirmed"
                          ? "success"
                          : b.status === "pending"
                          ? "warning"
                          : "default"
                      }
                    >
                      {b.status}
                    </Badge>
                    {Number(b.amount_paid) > 0 && (
                      <span className="text-xs text-slate-500">
                        {formatCurrency(b.amount_paid, b.currency)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Link to="/creator/sessions/new" className="btn-primary">
          + Create new session
        </Link>
      </div>
    </div>
  );
}

export default CreatorDashboardPage;
