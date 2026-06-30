import { api } from "./axios";
import type { Paginated, Session, SessionStatus } from "./types";

export interface ListSessionFilters {
  [key: string]: string | number | undefined;
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  difficulty?: string;
  location_type?: string;
  status?: SessionStatus;
  scheduled_from?: string;
  scheduled_to?: string;
  price_min?: number;
  price_max?: number;
  tag?: string;
  creator?: string;
  ordering?: string;
}

export interface SessionWritePayload {
  title: string;
  description?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration_minutes?: number;
  price?: number | string;
  currency?: string;
  capacity: number;
  scheduled_at?: string | null;
  location_type?: "online" | "in_person" | "hybrid";
  status?: SessionStatus;
  thumbnail_url?: string;
  tags?: string[];
  images?: string[];
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function listPublicSessions(
  filters: ListSessionFilters = {}
): Promise<Paginated<Session>> {
  const { data } = await api.get<Paginated<Session>>(`/sessions${qs(filters)}`);
  return data;
}

export async function getPublicSession(id: string): Promise<Session> {
  const { data } = await api.get<Session>(`/sessions/${id}`);
  return data;
}

export async function listMyCreatorSessions(
  filters: ListSessionFilters = {}
): Promise<Paginated<Session>> {
  const { data } = await api.get<Paginated<Session>>(
    `/creator/sessions${qs(filters)}`
  );
  return data;
}

export async function getCreatorSession(id: string): Promise<Session> {
  const { data } = await api.get<Session>(`/creator/sessions/${id}`);
  return data;
}

export async function createSession(
  payload: SessionWritePayload
): Promise<Session> {
  const { data } = await api.post<Session>("/creator/sessions/", payload);
  return data;
}

export async function updateSession(
  id: string,
  payload: Partial<SessionWritePayload>
): Promise<Session> {
  const { data } = await api.patch<Session>(
    `/creator/sessions/${id}/`,
    payload
  );
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/creator/sessions/${id}/`);
}

export async function setSessionStatus(
  id: string,
  action: "publish" | "unpublish" | "archive"
): Promise<Session> {
  const { data } = await api.post<Session>(
    `/creator/sessions/${id}/status/`,
    { action }
  );
  return data;
}
