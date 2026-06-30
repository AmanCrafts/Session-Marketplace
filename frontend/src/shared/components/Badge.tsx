import type { ReactNode } from "react";
import { classNames } from "../utils/format";

type Tone = "default" | "success" | "warning" | "info" | "danger";

const TONE: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-brand-50 text-brand-700",
  danger: "bg-rose-50 text-rose-700",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={classNames("badge", TONE[tone], className)}>
      {children}
    </span>
  );
}
