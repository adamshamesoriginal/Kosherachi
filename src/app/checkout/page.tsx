"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRestaurant } from "@/hooks/useRestaurant";
import { SERVICE_FEE, VAT_RATE } from "@/lib/pricing";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartRestaurantId, cartTotal, user, authLoading, clearCart } = useApp();
  const { restaurant, loading: restaurantLoading } = useRestaurant(cartRestaurantId);

  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Redirecting to the payment provider (or, in demo mode, to the order
  // page) also empties the cart eventually, which would otherwise trigger
  // the empty-cart redirect below and race with that navigation.
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    if (cart.length === 0 && !orderPlacedRef.current) {
      router.replace("/cart");
    }
  }, [cart.length, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?next=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling from the account once user loads
    if (user?.phone && !phoneTouched) setPhone(user.phone);
  }, [user, phoneTouched]);

  if (cart.length === 0 || authLoading || !user) {
    return null;
  }

  if (restaurantLoading || !restaurant) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  const deliveryFee = mode === "delivery" ? restaurant.deliveryFee : 0;
  const total = cartTotal + deliveryFee + SERVICE_FEE;
  const vatIncluded = total - total / (1 + VAT_RATE);

  const canSubmit = (mode === "pickup" || address.trim().length > 3) && phone.trim().length >= 9;

  const placeOrder = async () => {
    if (!canSubmit || placing) return;
    setPlacing(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          items: cart.map((c) => ({
            menuItemId: c.item.id,
            quantity: c.quantity,
            selectedChoiceIds: c.selectedOptions.map((o) => o.choiceId),
            note: c.note || undefined,
          })),
          address,
          phone,
          pickupOrDelivery: mode,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "ההזמנה נכשלה, נסו שוב");
      }
      const order = await res.json();
      orderPlacedRef.current = true;
      if (order.redirectUrl) {
        // Full-page navigation to the hosted payment page — the cart stays
        // intact in localStorage until payment is actually confirmed (see
        // the order tracking page), so cancelling and coming back doesn't
        // lose it.
        window.location.href = order.redirectUrl;
        return;
      }
      // No payment provider configured (demo mode): the order is already
      // marked paid, same as the app has always behaved.
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "ההזמנה נכשלה, נסו שוב");
      setPlacing(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-extrabold">תשלום ואישור הזמנה</h1>
        <p className="text-sm text-stone-500">{restaurant.name}</p>
      </header>

      <div className="px-4 flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-sm text-stone-700">אופן קבלה</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("delivery")}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold ${
                mode === "delivery"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-stone-200 text-stone-500"
              }`}
            >
              🛵 משלוח
            </button>
            <button
              onClick={() => setMode("pickup")}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold ${
                mode === "pickup"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-stone-200 text-stone-500"
              }`}
            >
              🏠 איסוף עצמי
            </button>
          </div>
        </section>

        {mode === "delivery" && (
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold text-sm text-stone-700">כתובת למשלוח</h2>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="רחוב, מספר בית, עיר"
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-sm text-stone-700">טלפון ליצירת קשר</h2>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneTouched(true);
            }}
            placeholder="05X-XXXXXXX"
            inputMode="tel"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-sm text-stone-700">הערות להזמנה (אופציונלי)</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="לדוגמה: בבקשה לצלצל בפעמון, קוד כניסה 1234"
            rows={2}
            maxLength={300}
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 resize-none"
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>סכום ביניים</span>
            <span>₪{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>משלוח</span>
            <span>{deliveryFee === 0 ? "חינם" : `₪${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>דמי שירות</span>
            <span>₪{SERVICE_FEE.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-400 text-xs">
            <span>כולל מע״מ ({(VAT_RATE * 100).toFixed(0)}%)</span>
            <span>₪{vatIncluded.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-stone-900 pt-1.5 mt-1 border-t border-stone-100">
            <span>סה״כ לתשלום</span>
            <span>₪{total.toFixed(2)}</span>
          </div>
        </section>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          התשלום מתבצע בעמוד מאובטח של ספק הסליקה — פרטי האשראי שלכם לא
          עוברים דרך שרתי KosherGo.
        </p>

        {submitError && (
          <p className="text-sm text-red-600 text-center">{submitError}</p>
        )}

        <p className="text-[11px] text-stone-400 leading-relaxed">
          בביצוע ההזמנה אתם מאשרים את{" "}
          <Link href="/legal/terms" className="underline">
            תנאי השימוש
          </Link>{" "}
          ו
          <Link href="/legal/consumer" className="underline">
            מדיניות ביטול עסקה
          </Link>{" "}
          בהתאם לחוק הגנת הצרכן, התשמ״א-1981.
        </p>
      </div>

      <div className="mt-auto px-4 py-4">
        <button
          onClick={placeOrder}
          disabled={!canSubmit || placing}
          className="w-full rounded-2xl bg-emerald-700 py-3.5 font-bold text-white disabled:opacity-40"
        >
          {placing ? "מעביר לתשלום..." : `מעבר לתשלום מאובטח · ₪${total.toFixed(0)}`}
        </button>
      </div>
    </main>
  );
}
