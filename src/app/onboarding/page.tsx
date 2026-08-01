"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AREAS } from "@/lib/data";
import { FOOD_TYPES, FoodType, KASHRUT_LEVELS, KashrutLevel } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { prefs, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [kashrutLevels, setKashrutLevels] = useState<KashrutLevel[]>(
    prefs.kashrutLevels
  );
  const [foodTypes, setFoodTypes] = useState<FoodType[]>(prefs.foodTypes);
  const [area, setArea] = useState<string | null>(prefs.area);

  const toggleKashrut = (id: KashrutLevel) =>
    setKashrutLevels((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );

  const toggleFoodType = (id: FoodType) =>
    setFoodTypes((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );

  const steps = ["אזור", "רמת כשרות", "סוג תפריט"];

  const finish = () => {
    completeOnboarding({ kashrutLevels, foodTypes, area });
    router.push("/home");
  };

  return (
    <main className="flex-1 flex flex-col px-6 py-8 gap-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          שלב {step + 1} מתוך {steps.length}
        </p>
        <div className="mt-2 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-emerald-600" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">איפה אתם נמצאים?</h1>
          <p className="text-stone-500 text-sm">
            נציג לכם מסעדות שמשלחות לאזור שלכם.
          </p>
          <div className="flex flex-col gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`text-right rounded-xl border px-4 py-3 font-medium transition-colors ${
                  area === a
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">רמת הכשרות שלכם</h1>
          <p className="text-stone-500 text-sm">
            אפשר לבחור יותר מאחת. נציג רק מסעדות עם תעודת כשרות מאומתת ברמה
            שבחרתם.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {KASHRUT_LEVELS.map((k) => (
              <button
                key={k.id}
                onClick={() => toggleKashrut(k.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-5 transition-colors ${
                  kashrutLevels.includes(k.id)
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-2xl">{k.emoji}</span>
                <span className="font-semibold text-stone-800 text-sm">
                  {k.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">מה בתפריט?</h1>
          <p className="text-stone-500 text-sm">
            בשרי, חלבי או פרווה — אפשר לבחור הכל, ואפשר לשנות בכל רגע.
          </p>
          <div className="flex flex-col gap-3">
            {FOOD_TYPES.map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFoodType(f.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-colors ${
                  foodTypes.includes(f.id)
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-2xl">{f.emoji}</span>
                <span className="font-semibold text-stone-800">
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-3 pt-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border border-stone-300 py-3.5 font-semibold text-stone-600"
          >
            חזרה
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !area}
            className="flex-[2] rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
          >
            המשך
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={kashrutLevels.length === 0 || foodTypes.length === 0}
            className="flex-[2] rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
          >
            סיום — הצג מסעדות
          </button>
        )}
      </div>
    </main>
  );
}
