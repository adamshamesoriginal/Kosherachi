"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const LINKS = [
  { href: "/onboarding", label: "העדפות כשרות ואזור", icon: "🛠️" },
  { href: "/orders", label: "ההזמנות שלי", icon: "🧾" },
  { href: "/partner", label: "אני בעל מסעדה", icon: "🏪" },
  { href: "/legal/kashrut", label: "מדיניות כשרות ואימות", icon: "✅" },
  { href: "/legal/consumer", label: "הגנת הצרכן וביטול עסקה", icon: "⚖️" },
  { href: "/legal/privacy", label: "מדיניות פרטיות", icon: "🔒" },
  { href: "/legal/terms", label: "תנאי שימוש", icon: "📄" },
  { href: "/legal/accessibility", label: "הצהרת נגישות", icon: "♿" },
];

export default function MorePage() {
  const router = useRouter();
  const { user, authLoading, logout } = useApp();

  let links = LINKS;
  if (user?.isAdmin) {
    links = [{ href: "/admin", label: "ניהול — בקשות הצטרפות וכשרות", icon: "🛡️" }, ...links];
  }
  if (user && user.ownedRestaurants.length > 0) {
    links = [{ href: "/dashboard", label: "לוח בקרה לבית העסק שלי", icon: "📊" }, ...links];
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4">
      <h1 className="text-xl font-extrabold">עוד</h1>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center justify-between">
        {authLoading ? (
          <p className="text-sm text-stone-400">טוען...</p>
        ) : user ? (
          <>
            <div>
              <p className="text-xs text-stone-500">מחוברים כ</p>
              <p className="font-semibold text-stone-900" dir="ltr">
                {user.phone ?? user.email ?? user.name ?? "—"}
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600"
            >
              התנתקות
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500">לא מחוברים</p>
            <Link
              href="/auth"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              התחברות
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-stone-700 ${
              i !== links.length - 1 ? "border-b border-stone-100" : ""
            }`}
          >
            <span className="text-lg">{l.icon}</span>
            <span className="flex-1">{l.label}</span>
            <span className="text-stone-300">‹</span>
          </Link>
        ))}
      </div>
      <p className="text-center text-xs text-stone-400 mt-2">KosherGo · גרסת MVP</p>
    </main>
  );
}
