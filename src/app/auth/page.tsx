"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

const RESEND_COOLDOWN_SECONDS = 30;

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { prefs, refreshUser } = useApp();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestOtp = async () => {
    if (submitting || cooldown > 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שליחת הקוד נכשלה");
      setDevCode(data.devCode ?? null);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שליחת הקוד נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "האימות נכשל");
      await refreshUser();
      router.push(next || (prefs.onboarded ? "/home" : "/onboarding"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "האימות נכשל");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-3xl">
          📱
        </div>
        <h1 className="text-xl font-extrabold">
          {step === "phone" ? "התחברות עם מספר טלפון" : "הזינו את קוד האימות"}
        </h1>
        <p className="text-sm text-stone-500 max-w-xs">
          {step === "phone"
            ? "נשלח לכם קוד חד-פעמי לאימות המספר. אין צורך בסיסמה."
            : `שלחנו קוד בן 6 ספרות למספר ${phone}`}
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {step === "phone" ? (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            inputMode="tel"
            dir="ltr"
            className="rounded-xl border border-stone-200 px-4 py-3 text-center text-lg tracking-wide outline-none focus:border-emerald-500"
          />
        ) : (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            dir="ltr"
            maxLength={6}
            className="rounded-xl border border-stone-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald-500"
          />
        )}

        {devCode && step === "otp" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">מצב הדגמה — אין עדיין ספק SMS מחובר</p>
            <p className="mt-1">
              הקוד שלכם: <span className="font-mono text-lg tracking-widest">{devCode}</span>
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {step === "phone" ? (
          <button
            onClick={requestOtp}
            disabled={submitting || phone.trim().length < 9}
            className="rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
          >
            {submitting ? "שולח..." : "שליחת קוד אימות"}
          </button>
        ) : (
          <>
            <button
              onClick={verifyOtp}
              disabled={submitting || code.length !== 6}
              className="rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
            >
              {submitting ? "מאמת..." : "אימות והתחברות"}
            </button>
            <div className="flex items-center justify-between text-sm text-stone-500 px-1">
              <button
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
                className="underline"
              >
                שינוי מספר
              </button>
              <button
                onClick={requestOtp}
                disabled={cooldown > 0 || submitting}
                className="underline disabled:opacity-40 disabled:no-underline"
              >
                {cooldown > 0 ? `שליחה חוזרת (${cooldown})` : "שליחה חוזרת"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}
