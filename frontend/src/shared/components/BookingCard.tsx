import type { Booking } from "../api/types";
import { Badge } from "./Badge";
import { Card } from "./Card";
import {
  formatCurrency,
  formatDateTime,
  pluralize,
} from "../utils/format";

interface BookingCardProps {
  booking: Booking;
  perspective: "user" | "creator";
  onCancel?: (booking: Booking) => void;
  cancelling?: boolean;
}

const STATUS_TONES = {
  pending: "warning",
  confirmed: "success",
  canceled: "default",
  failed: "danger",
  refunded: "info",
} as const;

export function BookingCard({
  booking,
  perspective,
  onCancel,
  cancelling,
}: BookingCardProps) {
  const { session } = booking;
  return (
    <Card padding="md" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{session.title}</h3>
          <p className="text-xs text-slate-500">
            {session.creator.full_name || session.creator.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONES[booking.status]}>
            {booking.status}
          </Badge>
          {Number(booking.amount_paid) > 0 && (
            <Badge tone="info">
              {formatCurrency(booking.amount_paid, booking.currency)}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">When</div>
          <div>{session.scheduled_at ? formatDateTime(session.scheduled_at) : "TBD"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {perspective === "user" ? "Capacity" : "Booked"}
          </div>
          <div>
            {perspective === "user"
              ? `${session.capacity} ${pluralize(session.capacity, "seat")}`
              : pluralize(session.bookings_count, "booking")}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Booked at</div>
          <div>{formatDateTime(booking.booked_at)}</div>
        </div>
      </div>

      {perspective === "user" && booking.is_active && onCancel && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-rose-600 hover:underline disabled:opacity-50"
            onClick={() => onCancel(booking)}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      )}
    </Card>
  );
}
