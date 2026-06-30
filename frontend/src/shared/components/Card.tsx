import type { ReactNode } from "react";
import { classNames } from "../utils/format";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const PAD: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return <div className={classNames("card", PAD[padding], className)}>{children}</div>;
}
