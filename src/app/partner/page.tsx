"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");

  const canSubmit = name.trim() && businessId.trim() && phone.trim() && area.trim();

  if (submitted) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="text-xl font-extrabold">תודה, {name}!</h1>
        <p className="text-stone-600">
          קיבלנו את הפרטים ונציג של KosherGo יחזור אליכם תוך יום עסקים אחד עם
          שלבי ההצטרפות, כולל הצגת תעודת הכשרות של העסק.
        </p>
        <Link href="/home" className="text-emerald-700 underline">
          חזרה לאפליקציה
        </Link>
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) setSubmitted(true);
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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="טלפון ליצירת קשר"
          inputMode="tel"
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="עיר / אזור"
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
        <div className="rounded-xl border border-dashed border-stone-300 px-4 py-4 text-center text-sm text-stone-500">
          📎 בשלב ההצטרפות תתבקשו להעלות צילום תעודת כשרות בתוקף — נדרש עבור
          כל בית עסק המוצג באפליקציה.
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
        >
          שליחת בקשת הצטרפות
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
    </main>
  );
}
