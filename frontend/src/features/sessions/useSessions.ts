import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSession,
  deleteSession,
  getCreatorSession,
  getPublicSession,
  listMyCreatorSessions,
  listPublicSessions,
  setSessionStatus,
  updateSession,
  type ListSessionFilters,
  type SessionWritePayload,
} from "../../shared/api/sessions";
import type { Session } from "../../shared/api/types";

const PUBLIC_KEY = ["sessions", "public"] as const;
const CREATOR_KEY = ["sessions", "creator"] as const;
const DETAIL_KEY = (id: string) => ["sessions", "detail", id] as const;

export function usePublicSessions(filters: ListSessionFilters) {
  return useQuery({
    queryKey: ["sessions", "public", filters],
    queryFn: () => listPublicSessions(filters),
    staleTime: 30_000,
  });
}

export function usePublicSession(id: string | undefined) {
  return useQuery({
    queryKey: DETAIL_KEY(id ?? ""),
    queryFn: () => getPublicSession(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreatorSessions(filters: ListSessionFilters) {
  return useQuery({
    queryKey: ["sessions", "creator", filters],
    queryFn: () => listMyCreatorSessions(filters),
    staleTime: 30_000,
  });
}

export function useCreatorSession(id: string | undefined) {
  return useQuery({
    queryKey: ["sessions", "creator", "detail", id ?? ""],
    queryFn: () => getCreatorSession(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SessionWritePayload) => createSession(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
      qc.invalidateQueries({ queryKey: PUBLIC_KEY });
    },
  });
}

export function useUpdateSession(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SessionWritePayload>) =>
      updateSession(id, payload),
    onSuccess: (session: Session) => {
      qc.setQueryData(DETAIL_KEY(id), session);
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
      qc.invalidateQueries({ queryKey: PUBLIC_KEY });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
      qc.invalidateQueries({ queryKey: PUBLIC_KEY });
    },
  });
}

export function useSetSessionStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: "publish" | "unpublish" | "archive") =>
      setSessionStatus(id, action),
    onSuccess: (session: Session) => {
      qc.setQueryData(DETAIL_KEY(id), session);
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
      qc.invalidateQueries({ queryKey: PUBLIC_KEY });
    },
  });
}
