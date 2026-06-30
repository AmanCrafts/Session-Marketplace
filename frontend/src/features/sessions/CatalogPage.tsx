import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { SessionCard } from "../../shared/components/SessionCard";
import { Container } from "../../shared/components/Container";
import { PageHeader } from "../../shared/components/PageHeader";
import { CountChip, GridSkeleton } from "../../shared/components/Loading";
import { usePublicSessions } from "./useSessions";
import {
  SessionsFilters,
  toApiFilters,
  type SessionsFiltersState,
} from "./SessionsFilters";
import { useAuth } from "../auth/useAuth";
import { classNames } from "../../shared/utils/format";

export function CatalogPage() {
  const { session } = useAuth();
  const [state, setState] = useState<SessionsFiltersState>({
    q: "",
    category: "",
    difficulty: "",
    location_type: "",
    tag: "",
    price_min: "",
    price_max: "",
  });
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePublicSessions(
    toApiFilters(state, page)
  );

  const results = data?.results ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="Catalog"
        title="Browse sessions"
        description="Find sessions by topic, level, format, or price."
        action={
          !session ? (
            <Link to="/signup" className="btn-primary">
              Sign up to book
            </Link>
          ) : null
        }
      />
      <SessionsFilters
        value={state}
        onApply={(next) => {
          setState(next);
          setPage(1);
        }}
      />

      <div className="mt-8 flex items-center justify-between">
        {data && (
          <p className="text-sm text-slate-500">
            {data.count > 0 ? (
              <>
                Showing {data.results.length} of {data.count}
                <CountChip count={data.count} />
              </>
            ) : (
              "No results yet"
            )}
          </p>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <GridSkeleton count={6} />
        ) : isError ? (
          <EmptyState
            title="Couldn't load sessions"
            description="The catalog failed to load. Check your connection and try again."
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No sessions match those filters"
            description="Try clearing filters or searching for a different topic."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={classNames(
                "h-9 min-w-9 rounded-md px-3 text-sm font-medium",
                p === page
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          ))}
        </nav>
      )}

      {/* 404 fallback when API returns an ID that doesn't exist */}
      {!isLoading && !isError && results.length === 0 && (
        <Card className="mt-8 p-6 text-center text-sm text-slate-500">
          Looking for something specific? Try clearing filters above.
        </Card>
      )}
    </Container>
  );
}

export default CatalogPage;
