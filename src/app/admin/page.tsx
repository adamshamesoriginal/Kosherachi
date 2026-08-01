"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PartnerApplication } from "@/lib/types";

interface AdminRestaurant {
  id: string;
  name: string;
  area: string;
  published: boolean;
  kashrutLevel: string;
  certifyingBody: string;
  certificateNumber: string;
  certificateExpiryDate: string;
  certificateVerified: boolean;
  ownerPhone: string | null;
  ownerEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "ממתין",
  approved: "אושר",
  rejected: "נדחה",
};

type Tab = "applications" | "restaurants";

export default function AdminPage() {
  const router = useRouter();
  const { user, authLoading } = useApp();
  const [tab, setTab] = useState<Tab>("applications");

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/auth?next=/admin");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-stone-700">אין לכם הרשאת ניהול</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-extrabold">ניהול</h1>
      </header>

      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-4">
        <div className="flex gap-4">
          {[
            { id: "applications", label: "בקשות הצטרפות" },
            { id: "restaurants", label: "מסעדות וכשרות" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-stone-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "applications" ? <ApplicationsTab /> : <RestaurantsTab />}
    </main>
  );
}

function ApplicationsTab() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/partner-applications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PartnerApplication[]) => setApplications(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-400">טוען...</p>;
  }
  if (applications.length === 0) {
    return <p className="px-4 py-8 text-center text-stone-400">אין בקשות הצטרפות</p>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {applications.map((app) => (
        <div key={app.id} className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-stone-900">{app.businessName}</span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                app.status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : app.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {STATUS_LABEL[app.status]}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            ח.פ/עוסק: {app.businessId} · אזור: {app.area}
          </p>
          <p className="text-xs text-stone-500" dir="ltr">
            {app.applicantPhone ?? app.applicantEmail ?? "—"}
          </p>
          <p className="text-xs text-stone-400">
            {new Date(app.createdAt).toLocaleString("he-IL")}
          </p>
          {app.status === "pending" && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => act(app.id, "approve")}
                disabled={busyId === app.id}
                className="flex-1 rounded-lg bg-emerald-700 text-white font-semibold py-2 text-sm disabled:opacity-40"
              >
                אישור
              </button>
              <button
                onClick={() => act(app.id, "reject")}
                disabled={busyId === app.id}
                className="flex-1 rounded-lg border border-stone-300 text-stone-600 font-semibold py-2 text-sm disabled:opacity-40"
              >
                דחייה
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminRestaurant[]) => setRestaurants(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleVerified = async (r: AdminRestaurant) => {
    setBusyId(r.id);
    const nextVerified = !r.certificateVerified;
    setRestaurants((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, certificateVerified: nextVerified } : x))
    );
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}/verify-kashrut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: nextVerified }),
      });
      if (!res.ok) {
        setRestaurants((prev) =>
          prev.map((x) => (x.id === r.id ? { ...x, certificateVerified: r.certificateVerified } : x))
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-400">טוען...</p>;
  }
  if (restaurants.length === 0) {
    return <p className="px-4 py-8 text-center text-stone-400">אין מסעדות</p>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {restaurants.map((r) => (
        <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-stone-900">{r.name}</span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                r.published ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
              }`}
            >
              {r.published ? "מפורסם" : "טרם פורסם"}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            {r.area} · בעלים: <span dir="ltr">{r.ownerPhone ?? r.ownerEmail ?? "—"}</span>
          </p>
          <p className="text-xs text-stone-500">
            {r.certifyingBody || "—"} · {r.certificateNumber || "—"} · תוקף עד{" "}
            {new Date(r.certificateExpiryDate).toLocaleDateString("he-IL")}
          </p>
          <label className="flex items-center gap-2 text-sm text-stone-600 mt-1">
            <input
              type="checkbox"
              checked={r.certificateVerified}
              disabled={busyId === r.id}
              onChange={() => toggleVerified(r)}
              className="h-4 w-4"
            />
            תעודת כשרות אומתה מול הגוף המפקח
          </label>
        </div>
      ))}
    </div>
  );
}
