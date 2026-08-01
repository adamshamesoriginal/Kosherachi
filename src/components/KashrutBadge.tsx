import { KASHRUT_LEVELS, KashrutLevel } from "@/lib/types";

export function KashrutBadge({
  level,
  size = "md",
}: {
  level: KashrutLevel;
  size?: "sm" | "md";
}) {
  const info = KASHRUT_LEVELS.find((k) => k.id === level)!;
  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${info.color} ${sizeClasses}`}
    >
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  );
}
