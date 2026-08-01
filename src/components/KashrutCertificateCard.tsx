"use client";

import { useState } from "react";
import Image from "next/image";
import { KashrutCertificate } from "@/lib/types";
import { KashrutBadge } from "./KashrutBadge";
import { isCertificateExpired, isCertificateExpiringSoon } from "@/lib/data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function KashrutCertificateCard({ cert }: { cert: KashrutCertificate }) {
  const [open, setOpen] = useState(false);
  const expired = isCertificateExpired(cert.expiryDate);
  const expiringSoon = !expired && isCertificateExpiringSoon(cert.expiryDate);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900">תעודת כשרות</h3>
        <KashrutBadge level={cert.level} />
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-stone-500">גוף מפקח</dt>
        <dd className="text-stone-900 font-medium text-left">{cert.certifyingBody}</dd>
        <dt className="text-stone-500">מספר תעודה</dt>
        <dd className="text-stone-900 font-medium text-left">{cert.certificateNumber}</dd>
        <dt className="text-stone-500">בתוקף עד</dt>
        <dd
          className={`font-medium text-left ${
            expired ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-stone-900"
          }`}
        >
          {formatDate(cert.expiryDate)}
        </dd>
      </dl>

      {expired && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">
          שימו לב: תוקף התעודה שהוצג פג. אנו מבקשים מהעסק תעודה מעודכנת — ניתן
          לפנות לתמיכה לבירור.
        </div>
      )}
      {expiringSoon && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2">
          תוקף התעודה מסתיים בקרוב. העסק נדרש לחדש אותה מול הגורם המפקח.
        </div>
      )}
      {cert.verified && !expired && (
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
          <span>✅</span>
          <span>אומת מול תעודת הכשרות שסופקה על ידי העסק</span>
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-emerald-700 underline underline-offset-2 self-start"
      >
        צפייה בצילום התעודה
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 w-full">
              <Image
                src={cert.certificateImageUrl}
                alt="תעודת כשרות"
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 font-semibold text-stone-700 border-t border-stone-100"
            >
              סגירה
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-stone-400">
        המידע מוצג כפי שסופק על ידי בית העסק בהתאם לחוק איסור הונאה בכשרות,
        התשמ״ג-1983. KosherGo אינה גוף כשרות ואינה מתחייבת לרמת הפיקוח בפועל
        — לפרטים ר׳{" "}
        <a href="/legal/kashrut" className="underline">
          מדיניות הכשרות
        </a>
        .
      </p>
    </div>
  );
}
