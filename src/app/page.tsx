"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function SplashPage() {
  const { prefs, user, authLoading } = useApp();

  const primaryHref = !user ? "/auth" : prefs.onboarded ? "/home" : "/onboarding";
  const primaryLabel = !user
    ? "בואו נתחיל"
    : prefs.onboarded
      ? "המשך לאפליקציה"
      : "המשך להגדרת העדפות";

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-700 text-4xl shadow-lg shadow-emerald-900/20">
          🍽️
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-900">
          Kosher<span className="text-emerald-600">Go</span>
        </h1>
        <p className="text-stone-600 max-w-xs">
          כל מה שאתה רואה — כשר ומאומת.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs text-sm text-stone-500">
        <p>בוחרים רמת כשרות, ורואים רק מסעדות שמתאימות בדיוק לכם.</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link
          href={primaryHref}
          aria-disabled={authLoading}
          className="w-full rounded-2xl bg-emerald-700 text-white font-bold py-3.5 shadow-md shadow-emerald-900/20 active:scale-[0.98] transition-transform"
        >
          {primaryLabel}
        </Link>
        {user && prefs.onboarded && (
          <Link
            href="/onboarding"
            className="w-full rounded-2xl border border-stone-300 text-stone-600 font-medium py-3 active:scale-[0.98] transition-transform"
          >
            עדכון העדפות כשרות
          </Link>
        )}
      </div>

      <Link href="/legal/kashrut" className="text-xs text-stone-400 underline">
        איך אנחנו מוודאים כשרות?
      </Link>
    </main>
  );
}
