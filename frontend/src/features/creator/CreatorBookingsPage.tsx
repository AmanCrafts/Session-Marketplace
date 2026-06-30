import { useState } from "react";
import { Card } from "../../shared/components/Card";
import { BookingCard } from "../../shared/components/BookingCard";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { Button } from "../../shared/components/Button";
import { Spinner } from "../../shared/components/Loading";
import { useCreatorBookings } from "../bookings/useBookings";

export function CreatorBookingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCreatorBookings({ page });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Loading bookings…
      </div>
    );
  }

  const items = data?.results ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Creator hub"
        title="Session bookings"
        description="Everyone who's booked any of your sessions."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="As soon as someone books, you'll see their details here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((b) => (
            <BookingCard key={b.id} booking={b} perspective="creator" />
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

      <Card padding="md" className="mt-8 text-sm text-slate-500">
        Need to reach out to a specific attendee? Use email in their profile
        once they've made their booking public.
      </Card>
    </div>
  );
}

export default CreatorBookingsPage;
