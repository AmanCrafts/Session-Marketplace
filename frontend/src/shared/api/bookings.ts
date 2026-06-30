import { api } from "./axios";
import type { Booking, Paginated } from "./types";

export interface ListBookingsFilters {
  page?: number;
  page_size?: number;
}

export async function listMyBookings(
  filters: ListBookingsFilters = {}
): Promise<Paginated<Booking>> {
  const sp = new URLSearchParams();
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.page_size) sp.set("page_size", String(filters.page_size));
  const qs = sp.toString();
  const { data } = await api.get<Paginated<Booking>>(
    `/bookings/me${qs ? `?${qs}` : ""}`
  );
  return data;
}

export async function createBooking(sessionId: string): Promise<Booking> {
  const { data } = await api.post<Booking>("/bookings/", { session_id: sessionId });
  return data;
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<Booking> {
  const { data } = await api.post<Booking>(
    `/bookings/${bookingId}/cancel/`,
    reason ? { reason } : {}
  );
  return data;
}

export async function listCreatorBookings(
  filters: ListBookingsFilters = {}
): Promise<Paginated<Booking>> {
  const sp = new URLSearchParams();
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.page_size) sp.set("page_size", String(filters.page_size));
  const qs = sp.toString();
  const { data } = await api.get<Paginated<Booking>>(
    `/creator/bookings${qs ? `?${qs}` : ""}`
  );
  return data;
}
