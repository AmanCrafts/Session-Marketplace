import { useEffect } from "react";
import { useToastStore } from "../hooks/useToast";
import { classNames } from "../utils/format";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            "pointer-events-auto w-full max-w-sm rounded-lg border bg-white p-3 text-sm shadow-cardHover",
            t.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            t.tone === "error" && "border-rose-200 bg-rose-50 text-rose-800",
            t.tone === "info" && "border-brand-200 bg-brand-50 text-brand-800"
          )}
          role="status"
        >
          <div className="flex items-start justify-between gap-2">
            <span>{t.message}</span>
            <button
              className="text-current opacity-60 hover:opacity-100"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
