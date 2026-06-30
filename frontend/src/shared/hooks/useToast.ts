import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";
import { ApiError } from "../api/axios";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }],
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const TONE_MESSAGE: Record<string, (err: unknown) => string | null> = {
  default: (err) => (err instanceof Error ? err.message : null),
};

/** Common helper: turn any thrown error into a user-friendly string. */
export function describeError(err: unknown, fallback = "Something went wrong."): string {
  if (!err) return fallback;
  if (err instanceof ApiError) {
    switch (err.code) {
      case "capacity_exceeded":
        return "This session is fully booked.";
      case "duplicate_booking":
        return "You already have a booking for this session.";
      case "session_not_bookable":
        return "This session isn't currently accepting bookings.";
      case "ownership_required":
        return "You don't have permission to do that.";
      default:
        return typeof err.message === "string" ? err.message : fallback;
    }
  }
  return TONE_MESSAGE.default(err) ?? fallback;
}

export function useToast() {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);

  const success = useCallback((message: string) => push({ tone: "success", message }), [push]);
  const error = useCallback(
    (err: unknown) => push({ tone: "error", message: describeError(err) }),
    [push]
  );
  const info = useCallback((message: string) => push({ tone: "info", message }), [push]);

  return { success, error, info, dismiss };
}

/** Auto-dismissing toast convenience wrapper. */
export function useAutoToast() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 3200);
    return () => clearTimeout(t);
  }, [open]);
  return { open, setOpen };
}
