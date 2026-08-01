"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FOOD_TYPES, FoodType, KASHRUT_LEVELS, KashrutLevel, Restaurant } from "@/lib/types";

export default function HomePage() {
  const { prefs } = useApp();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeKashrut, setActiveKashrut] = useState<KashrutLevel[]>(
    prefs.kashrutLevels
  );
  const [activeFoodTypes, setActiveFoodTypes] = useState<FoodType[]>(
    prefs.foodTypes
  );
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggleKashrut = (id: KashrutLevel) =>
    setActiveKashrut((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  const toggleFoodType = (id: FoodType) =>
    setActiveFoodTypes((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (prefs.area) params.set("area", prefs.area);
    if (activeKashrut.length) params.set("kashrut", activeKashrut.join(","));
    if (activeFoodTypes.length) params.set("foodType", activeFoodTypes.join(","));
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off a fetch tied to filter changes
    setLoading(true);
    setError(false);
    fetch(`/api/restaurants?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load restaurants");
        return res.json();
      })
      .then((data: Restaurant[]) => setRestaurants(data))
      .catch((err) => {
        if (err.name !== "AbortError") setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [prefs.area, activeKashrut, activeFoodTypes, debouncedQuery]);

  return (
    <main className="flex-1 flex flex-col">
      <header className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur px-4 pt-5 pb-3 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500">משלוח אל</p>
            <Link
              href="/onboarding"
              className="font-bold text-stone-900 flex items-center gap-1"
            >
              📍 {prefs.area ?? "בחרו אזור"}
              <span className="text-stone-400 text-xs">▾</span>
            </Link>
          </div>
          <div className="h-9 w-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold">
            KG
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפשו מסעדה או מנה..."
          className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {KASHRUT_LEVELS.map((k) => (
            <button
              key={k.id}
              onClick={() => toggleKashrut(k.id)}
              className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                activeKashrut.includes(k.id)
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <span>{k.emoji}</span>
              {k.label}
            </button>
          ))}
          <span className="w-px shrink-0 bg-stone-200 my-1" />
          {FOOD_TYPES.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFoodType(f.id)}
              className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                activeFoodTypes.includes(f.id)
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <span>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 flex flex-col gap-3">
        {error && (
          <div className="text-center py-16 flex flex-col items-center gap-2 text-red-500">
            <span className="text-3xl">⚠️</span>
            <p className="font-medium">שגיאה בטעינת המסעדות</p>
          </div>
        )}

        {!error && (
          <p className="text-sm text-stone-500">
            {loading ? "טוען..." : `${restaurants.length} מסעדות מתאימות להעדפות שלכם`}
          </p>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-2 text-stone-400">
            <span className="text-3xl">🍽️</span>
            <p className="font-medium">לא נמצאו מסעדות מתאימות</p>
            <p className="text-sm">נסו להרחיב את הסינון או לבחור אזור אחר</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </div>
    </main>
  );
}
