import { classNames } from "../utils/format";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  if (!initials) return null;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={classNames(
          "rounded-full object-cover ring-1 ring-slate-200",
          SIZE[size]
        )}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={classNames(
        "inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-brand-200",
        SIZE[size]
      )}
    >
      {initials}
    </span>
  );
}
