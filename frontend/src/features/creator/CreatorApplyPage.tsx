import { Link } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { useAuth } from "../auth/useAuth";

export function CreatorApplyPage() {
  const { identity } = useAuth();
  const isCreator = identity?.user.is_creator;

  return (
    <div className="mx-auto max-w-3xl">
      <Card padding="lg">
        <Badge tone={isCreator ? "success" : "info"} className="mb-2">
          {isCreator ? "You're already a creator" : "Creator application"}
        </Badge>
        <h1 className="text-2xl font-bold">
          {isCreator ? "Welcome back, creator." : "Become a creator"}
        </h1>
        <p className="mt-2 text-slate-600">
          {isCreator
            ? "Head into your hub to manage your sessions and bookings."
            : "Creators can publish unlimited sessions, manage bookings, and track engagement in their own hub."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Feature title="Curated exposure" body="Publish free or paid sessions to a marketplace of motivated learners." />
          <Feature title="Capacity you control" body="Set seats per session. Capacity is enforced server-side so your events stay intimate." />
          <Feature title="Real bookings" body="See real upcoming attendees and reach out if needed." />
          <Feature title="Built-in tools" body="Edit, publish, unpublish, or archive any session — all from one dashboard." />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isCreator ? (
            <Link to="/creator" className="btn-primary">
              Open creator hub
            </Link>
          ) : (
            <>
              <Link to="/sessions" className="btn-secondary">
                Browse sessions
              </Link>
              <Link to="/creator/claim" className="btn-primary">
                Request creator access
              </Link>
            </>
          )}
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        Role is granted by an admin or via the dev <code>promote_to_creator</code>{" "}
        endpoint. Until then, browse the catalog freely.
      </p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export default CreatorApplyPage;
