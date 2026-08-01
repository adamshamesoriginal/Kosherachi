import { FOOD_TYPES, FoodType } from "@/lib/types";

export function FoodTypeBadge({ type }: { type: FoodType }) {
  const info = FOOD_TYPES.find((f) => f.id === type)!;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 text-sm font-medium">
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  );
}
