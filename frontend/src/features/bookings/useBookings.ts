import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  createBooking,
  listCreatorBookings,
  listMyBookings,
  type ListBookingsFilters,
} from "../../shared/api/bookings";

const MY_KEY = ["bookings", "me"] as const;
const CREATOR_KEY = ["bookings", "creator"] as const;

export function useMyBookings(filters: ListBookingsFilters = {}) {
  return useQuery({
    queryKey: ["bookings", "me", filters],
    queryFn: () => listMyBookings(filters),
    staleTime: 15_000,
  });
}

export function useCreatorBookings(filters: ListBookingsFilters = {}) {
  return useQuery({
    queryKey: ["bookings", "creator", filters],
    queryFn: () => listCreatorBookings(filters),
    staleTime: 15_000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => createBooking(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_KEY });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelBooking(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_KEY });
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
