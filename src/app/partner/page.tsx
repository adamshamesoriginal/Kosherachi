"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PartnerApplication } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "ממתין לאישור",
  approved: "אושר",
  rejected: "נדחה",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PartnerPage() {
  const router = useRouter();
  const { user, authLoading } = useApp();

  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth?next=/partner");
      return;
    }
    fetch("/api/partner-applications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PartnerApplication[]) => setApplications(data))
      .finally(() => setLoadingApplications(false));
  }, [authLoading, user, router]);

  const canSubmit = name.trim() && businessId.trim() && area.trim();

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setJustSubmitted(false);
    try {
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name, businessId, area }),
      });
      if (!res.ok) throw new Error("השליחה נכשלה, נסו שוב");
      const created: PartnerApplication = await res.json();
      setApplications((prev) => [created, ...prev]);
      setName("");
      setBusinessId("");
      setArea("");
      setJustSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "השליחה נכשלה, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">הצטרפו כבית עסק</h1>
        <p className="text-stone-500 text-sm mt-1">
          ללא דמי הצטרפות. אנחנו מביאים לכם לקוחות חדשים ולוקחים עמלה רק
          כשנכנסת הזמנה.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-stone-200 bg-white py-3">
          <p className="text-lg font-extrabold text-emerald-700">0₪</p>
          <p className="text-stone-500">דמי הצטרפות</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white py-3">
          <p className="text-lg font-extrabold text-emerald-700">12%</p>
          <p className="text-stone-500">עמלה להזמנה</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white py-3">
          <p className="text-lg font-extrabold text-emerald-700">1 יום</p>
          <p className="text-stone-500">להצטרפות</p>
        </div>
      </div>

      {!loadingApplications && applications.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-stone-900 text-sm">הבקשות שלי</h2>
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-stone-200 bg-white p-3 flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-900">{app.businessName}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[app.status]}`}
                >
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
              <p className="text-xs text-stone-500">{app.area}</p>
              {app.reviewNote && (
                <p className="text-xs text-stone-500">הערה: {app.reviewNote}</p>
              )}
              {app.status === "approved" && app.restaurantId && (
                <Link
                  href={`/dashboard/${app.restaurantId}`}
                  className="mt-1 text-sm font-semibold text-emerald-700 underline"
                >
                  מעבר ללוח הבקרה של העסק ←
                </Link>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-bold text-stone-900 text-sm">בקשת הצטרפות חדשה</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם העסק"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <input
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="מספר עוסק מורשה / ח.פ"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="עיר / אזור"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-stone-400">
            ניצור איתכם קשר למספר המחובר לחשבון שלכם.
          </p>
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-4 text-center text-sm text-stone-500">
            📎 לאחר האישור תוכלו להעלות את פרטי תעודת הכשרות ולהשלים את
            התפריט בלוח הבקרה שלכם.
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {justSubmitted && (
            <p className="text-sm text-emerald-700 text-center">
              הבקשה נשלחה! נעדכן אתכם ברגע שהיא תיבדק.
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
          >
            {submitting ? "שולח..." : "שליחת בקשת הצטרפות"}
          </button>
          <p className="text-[11px] text-stone-400 text-center">
            בשליחת הטופס אתם מאשרים את{" "}
            <Link href="/legal/terms" className="underline">
              תנאי השימוש
            </Link>{" "}
            ואת{" "}
            <Link href="/legal/privacy" className="underline">
              מדיניות הפרטיות
            </Link>
            .
          </p>
        </form>
      </section>
    </main>
  );
}
