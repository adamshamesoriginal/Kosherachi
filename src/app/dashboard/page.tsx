"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function DashboardEntryPage() {
  const router = useRouter();
  const { user, authLoading } = useApp();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth?next=/dashboard");
      return;
    }
    if (user.ownedRestaurants.length === 1) {
      router.replace(`/dashboard/${user.ownedRestaurants[0].id}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  if (user.ownedRestaurants.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-3xl">🏪</span>
        <p className="font-medium text-stone-700">
          אין ברשותכם עסק מקושר לחשבון הזה
        </p>
        <p className="text-sm text-stone-500 max-w-xs">
          בעלי מסעדות שהצטרפו ל-KosherGo מקבלים כאן גישה לניהול התפריט
          וההזמנות שלהם.
        </p>
        <Link
          href="/partner"
          className="mt-2 rounded-2xl bg-emerald-700 text-white font-bold px-6 py-3"
        >
          הצטרפות כבית עסק
        </Link>
      </main>
    );
  }

  if (user.ownedRestaurants.length === 1) return null;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4">
      <h1 className="text-xl font-extrabold">העסקים שלי</h1>
      <div className="flex flex-col gap-3">
        {user.ownedRestaurants.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/${r.id}`}
            className="rounded-2xl border border-stone-200 bg-white p-4 font-semibold text-stone-900"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
