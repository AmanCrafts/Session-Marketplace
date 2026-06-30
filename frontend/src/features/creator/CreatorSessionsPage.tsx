import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { PageHeader } from "../../shared/components/PageHeader";
import { Spinner } from "../../shared/components/Loading";
import { EmptyState } from "../../shared/components/EmptyState";
import { Modal } from "../../shared/components/Modal";
import {
  useCreatorSessions,
  useDeleteSession,
} from "../sessions/useSessions";
import { useToast } from "../../shared/hooks/useToast";
import { useSetSessionStatusFor } from "./useSetSessionStatusFor";
import {
  formatDateTime,
  formatCurrency,
  pluralize,
} from "../../shared/utils/format";
import type { Session } from "../../shared/api/types";

export function CreatorSessionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCreatorSessions({ page });
  const del = useDeleteSession();
  const toast = useToast();
  const [confirming, setConfirming] = useState<Session | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Loading…
      </div>
    );
  }

  const items = data?.results ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Creator hub"
        title="My sessions"
        description="Create, edit, publish, and archive the sessions you host."
        action={
          <Link to="/creator/sessions/new" className="btn-primary">
            + New session
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Create your first session to start collecting bookings."
          action={
            <Link to="/creator/sessions/new" className="btn-primary">
              Create session
            </Link>
          }
        />
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-slate-100">
            {items.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onDelete={() => setConfirming(s)}
                onToast={toast.success}
              />
            ))}
          </ul>
        </Card>
      )}

      {(data?.total_pages ?? 0) > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: data!.total_pages }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "primary" : "secondary"}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            )
          )}
        </nav>
      )}

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Delete this session?"
        description="This permanently removes the session and any cancellation policies apply."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={del.isPending}
              onClick={async () => {
                if (!confirming) return;
                try {
                  await del.mutateAsync(confirming.id);
                  toast.success("Session deleted.");
                } catch (err) {
                  toast.error(err);
                } finally {
                  setConfirming(null);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {confirming && (
          <div className="text-sm text-slate-600">
            <strong className="text-slate-900">{confirming.title}</strong>
            <p className="mt-2">This action cannot be undone.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SessionRow({
  session,
  onDelete,
  onToast,
}: {
  session: Session;
  onDelete: () => void;
  onToast: (msg: string) => void;
}) {
  const setStatus = useSetSessionStatusFor(session.id);
  const toast = useToast();
  const handle = async (action: "publish" | "unpublish" | "archive") => {
    try {
      await setStatus.mutateAsync(action);
      onToast(`Session ${action}d.`);
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/creator/sessions/${session.id}/edit`}
            className="truncate font-medium hover:text-brand-700"
          >
            {session.title}
          </Link>
          <Badge
            tone={
              session.status === "published"
                ? "success"
                : session.status === "draft"
                ? "info"
                : session.status === "archived"
                ? "default"
                : "warning"
            }
          >
            {session.status}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>
            {session.scheduled_at ? formatDateTime(session.scheduled_at) : "TBD"}
          </span>
          <span>· {pluralize(session.bookings_count, "booking")}</span>
          <span>
            ·{" "}
            {Number(session.price) > 0
              ? formatCurrency(session.price, session.currency)
              : "Free"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            handle(session.status === "published" ? "unpublish" : "publish")
          }
        >
          {session.status === "published" ? "Unpublish" : "Publish"}
        </Button>
        {session.status !== "archived" && (
          <Button variant="secondary" size="sm" onClick={() => handle("archive")}>
            Archive
          </Button>
        )}
        <Link
          to={`/creator/sessions/${session.id}/edit`}
          className="btn-ghost text-sm"
        >
          Edit
        </Link>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

export default CreatorSessionsPage;
