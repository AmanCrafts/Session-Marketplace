import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicSession } from "./useSessions";
import { useCreateBooking } from "../bookings/useBookings";
import { useAuth } from "../auth/useAuth";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { Avatar } from "../../shared/components/Avatar";
import { EmptyState } from "../../shared/components/EmptyState";
import { ProgressBar } from "../../shared/components/Loading";
import { useToast } from "../../shared/hooks/useToast";
import {
  formatCurrency,
  formatDateTime,
  pluralize,
} from "../../shared/utils/format";

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = usePublicSession(sessionId);
  const navigate = useNavigate();
  const { session: auth } = useAuth();
  const createBooking = useCreateBooking();
  const toast = useToast();
  const imageIndex = 0;

  useEffect(() => {
    // reset scroll on session change
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <EmptyState
        title="Session not found"
        description="The session you are looking for may have been unpublished or removed."
        action={<Button onClick={() => navigate("/sessions")}>Browse sessions</Button>}
      />
    );
  }

  const handleBook = async () => {
    try {
      const booking = await createBooking.mutateAsync(session.id);
      toast.success(`Booking confirmed: ${booking.session.title}.`);
      if (auth) navigate("/bookings");
    } catch (err) {
      toast.error(err);
    }
  };

  const image = session.thumbnail_url || session.images?.[imageIndex]?.image_url;
  const remaining = Math.max(0, session.capacity - session.bookings_count);
  const priceLabel =
    Number(session.price) > 0 ? formatCurrency(session.price, session.currency) : "Free";

  return (
    <div className="space-y-8">
      <button
        type="button"
        className="text-sm text-slate-500 hover:text-slate-900"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-100 to-brand-50">
              {image ? (
                <img src={image} alt={session.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-300">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={session.is_bookable ? "success" : "default"}>
                  {session.is_bookable ? "Open for booking" : "Closed"}
                </Badge>
                <Badge tone="info">{session.difficulty}</Badge>
                <Badge tone="default">
                  {session.location_type.replace("_", " ")}
                </Badge>
                {session.category && <Badge tone="default">{session.category}</Badge>}
              </div>
              <h1 className="text-3xl font-bold">{session.title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Avatar
                  src={session.creator.avatar_url}
                  name={session.creator.full_name || session.creator.email}
                />
                <div>
                  <div className="font-medium text-slate-700">
                    {session.creator.full_name || session.creator.email}
                  </div>
                  <div>Host</div>
                </div>
              </div>

              <p className="whitespace-pre-line text-slate-600">
                {session.description || "The host hasn't added a description yet."}
              </p>

              {session.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {session.tags.map((t) => (
                    <Badge tone="info" key={t.id}>
                      #{t.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="text-3xl font-bold">{priceLabel}</div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>When</span>
                <span className="font-medium text-slate-900">
                  {session.scheduled_at ? formatDateTime(session.scheduled_at) : "TBD"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-medium text-slate-900">
                  {session.duration_minutes}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Capacity</span>
                <span className="font-medium text-slate-900">
                  {session.capacity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{pluralize(remaining, "seat")} left</span>
                <span className="font-medium text-slate-900">
                  {session.bookings_count}/{session.capacity}
                </span>
              </div>
              <ProgressBar
                value={session.bookings_count}
                max={Math.max(1, session.capacity)}
              />
            </div>

            {!auth ? (
              <Button
                size="lg"
                fullWidth
                onClick={() =>
                  navigate(
                    `/login?next=${encodeURIComponent(`/sessions/${session.id}`)}`
                  )
                }
                disabled={!session.is_bookable}
              >
                {session.is_bookable ? "Sign in to book" : "Booking closed"}
              </Button>
            ) : (
              <Button
                size="lg"
                fullWidth
                onClick={handleBook}
                disabled={!session.is_bookable || createBooking.isPending}
                loading={createBooking.isPending}
              >
                {session.is_bookable
                  ? Number(session.price) > 0
                    ? "Book this session"
                    : "Reserve free seat"
                  : "Booking closed"}
              </Button>
            )}
            <p className="text-center text-xs text-slate-400">
              You can manage your bookings from your dashboard.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
