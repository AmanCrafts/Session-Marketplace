import { Link } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { Avatar } from "../../shared/components/Avatar";
import { Button } from "../../shared/components/Button";
import { PageHeader } from "../../shared/components/PageHeader";
import { EmptyState } from "../../shared/components/EmptyState";
import { Badge } from "../../shared/components/Badge";
import { useMyBookings } from "../bookings/useBookings";
import { useProfile } from "../profile/useProfile";
import { useAuth } from "./useAuth";
import {
  formatCurrency,
  formatDateTime,
  pluralize,
} from "../../shared/utils/format";

export function DashboardPage() {
  const { identity } = useAuth();
  const { data: profile } = useProfile();
  const { data: bookingsData, isLoading } = useMyBookings({ page_size: 4 });

  const bookings = bookingsData?.results ?? [];
  const activeBookings = bookings.filter((b) => b.is_active);
  const pastBookings = bookings.filter((b) => !b.is_active);

  return (
    <div>
      <PageHeader
        eyebrow={`Logged in as ${identity?.user.role ?? "user"}`}
        title={`Welcome back${
          profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""
        }`}
        description="Manage your bookings, profile, and creator hub in one place."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || identity?.user.email || "You"}
              size="lg"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                {profile?.full_name || identity?.user.email}
              </div>
              <div className="truncate text-sm text-slate-500">
                {identity?.user.email}
              </div>
              {identity?.user.is_creator ? (
                <Badge tone="info" className="mt-2">
                  Creator
                </Badge>
              ) : (
                <Badge tone="default" className="mt-2">
                  User
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/profile" className="btn-secondary">
              Edit profile
            </Link>
            <Link to="/bookings" className="btn-ghost">
              All bookings
            </Link>
          </div>
          {identity?.user.is_creator ? (
            <Link to="/creator" className="btn-primary mt-4 w-full">
              Open creator hub
            </Link>
          ) : (
            <Link to="/creator/apply" className="btn-primary mt-4 w-full">
              Become a creator
            </Link>
          )}
        </Card>

        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Active bookings</h2>
            <Link to="/bookings" className="text-sm text-brand-700 hover:underline">
              See all →
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : activeBookings.length === 0 ? (
            <EmptyState
              title="No active bookings"
              description="Reserve your first session to see it here."
              action={
                <Link to="/sessions" className="btn-primary">
                  Browse sessions
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{b.session.title}</div>
                    <div className="text-xs text-slate-500">
                      {b.session.scheduled_at
                        ? formatDateTime(b.session.scheduled_at)
                        : "Schedule TBD"}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone="success">{b.status}</Badge>
                    <div className="mt-1 text-xs text-slate-400">
                      {Number(b.amount_paid) > 0
                        ? formatCurrency(b.amount_paid, b.currency)
                        : "Free"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h2 className="text-base font-semibold">Quick actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/sessions" className="btn-secondary">Browse</Link>
            <Link to="/bookings" className="btn-secondary">My bookings</Link>
            <Link to="/profile" className="btn-secondary">Profile</Link>
            {identity?.user.is_creator ? (
              <Link to="/creator/sessions/new" className="btn-primary">
                New session
              </Link>
            ) : (
              <Link to="/creator/apply" className="btn-primary">
                Become a creator
              </Link>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-base font-semibold">Past bookings</h2>
          {pastBookings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Once you attend a session, it'll appear here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {pastBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span className="truncate">{b.session.title}</span>
                  <span className="text-slate-500">{b.status}</span>
                </li>
              ))}
              <li className="text-xs text-slate-400">
                {pluralize(pastBookings.length, "past session")}
              </li>
            </ul>
          )}
          <div className="mt-4">
            <Button variant="ghost" size="sm">
              Export history (coming soon)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
