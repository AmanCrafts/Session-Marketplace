import { Link } from "react-router-dom";
import type { Session } from "../api/types";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { ProgressBar } from "./Loading";
import {
  formatCurrency,
  formatDateTime,
  pluralize,
} from "../utils/format";

export function SessionCard({ session }: { session: Session }) {
  const remaining = Math.max(0, session.capacity - session.bookings_count);
  const image = session.thumbnail_url || session.images?.[0]?.image_url;
  const priceLabel =
    Number(session.price) > 0 ? formatCurrency(session.price, session.currency) : "Free";
  return (
    <Link
      to={`/sessions/${session.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-cardHover hover:-translate-y-0.5"
    >
      <div className="relative h-40 w-full bg-gradient-to-br from-brand-100 via-brand-50 to-white">
        {image ? (
          <img
            src={image}
            alt={session.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-300">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm2 0v14h14V5H5zm3 3h2v2H8V8zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h6v2h-6V8zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" />
            </svg>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge tone={session.is_bookable ? "success" : "default"}>
            {session.is_bookable ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
            {session.title}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-slate-900">
            {priceLabel}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {session.description || "No description provided."}
        </p>

        {session.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {session.tags.slice(0, 3).map((t) => (
              <Badge key={t.id} tone="info">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Avatar
            src={session.creator.avatar_url}
            name={session.creator.full_name || session.creator.email}
            size="sm"
          />
          <span className="truncate">
            {session.creator.full_name || session.creator.email}
          </span>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="capitalize">
              {session.location_type.replace("_", " ")} · {session.duration_minutes}m
            </span>
            <span>
              {pluralize(remaining, "seat")} left
            </span>
          </div>
          <ProgressBar value={session.bookings_count} max={session.capacity} />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {session.scheduled_at ? formatDateTime(session.scheduled_at) : "Schedule TBD"}
        </div>
      </div>
    </Link>
  );
}
