import { Link } from "react-router-dom";
import { useState } from "react";
import { useMyBookings, useCancelBooking } from "./useBookings";
import { BookingCard } from "../../shared/components/BookingCard";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { Spinner } from "../../shared/components/Loading";
import { useToast } from "../../shared/hooks/useToast";
import type { Booking } from "../../shared/api/types";
import { Button } from "../../shared/components/Button";

export function BookingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyBookings({ page });
  const cancelBooking = useCancelBooking();
  const toast = useToast();

  const cancel = async (b: Booking) => {
    try {
      await cancelBooking.mutateAsync({ id: b.id });
      toast.success("Booking canceled.");
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="My account"
        title="My bookings"
        description="Track your upcoming and past sessions."
        action={
          <Link to="/sessions" className="btn-secondary">
            Browse more sessions
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner /> Loading your bookings…
        </div>
      ) : isError ? (
        <EmptyState
          title="Couldn't load your bookings"
          description="Check your connection and try again."
        />
      ) : (data?.results?.length ?? 0) === 0 ? (
        <EmptyState
          title="You haven't booked anything yet"
          description="When you do, your bookings will show up here."
          action={<Link to="/sessions" className="btn-primary">Find a session</Link>}
        />
      ) : (
        <div className="space-y-4">
          {data?.results.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              perspective="user"
              onCancel={cancel}
              cancelling={cancelBooking.isPending}
            />
          ))}
        </div>
      )}

      {(data?.total_pages ?? 0) > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: data!.total_pages }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                variant={p === page ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            )
          )}
        </nav>
      )}

      {/* Useful info card so the page never looks empty when zero-state exits */}
      <Card padding="md" className="mt-10 text-sm text-slate-500">
        Booking is a hard commitment — cancel at least 24 hours ahead if your plans
        change. Cancellations free up a seat for other learners.
      </Card>
    </div>
  );
}
