import Link from "next/link";

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
  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4">
      <h1 className="text-xl font-extrabold">עוד</h1>
      <div className="flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden">
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-stone-700 ${
              i !== LINKS.length - 1 ? "border-b border-stone-100" : ""
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
