"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getRestaurantById } from "@/lib/data";
import { Order } from "@/lib/types";

const VAT_RATE = 0.18; // Israel standard VAT rate; menu prices already include VAT
const SERVICE_FEE = 2.9;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartRestaurantId, cartTotal, addOrder, clearCart } = useApp();
  const restaurant = cartRestaurantId ? getRestaurantById(cartRestaurantId) : null;

  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (cart.length === 0 || !restaurant) {
      router.replace("/cart");
    }
  }, [cart.length, restaurant, router]);

  if (cart.length === 0 || !restaurant) {
    return null;
  }

  const deliveryFee = mode === "delivery" ? restaurant.deliveryFee : 0;
  const total = cartTotal + deliveryFee + SERVICE_FEE;
  const vatIncluded = total - total / (1 + VAT_RATE);

  const canSubmit =
    (mode === "pickup" || address.trim().length > 3) &&
    phone.trim().length >= 9 &&
    cardNumber.replace(/\s/g, "").length >= 12;

  const placeOrder = () => {
    if (!canSubmit) return;
    setPlacing(true);
    // eslint-disable-next-line react-hooks/purity -- id generated inside a user-triggered click handler, not during render
    const orderId = `KG-${Date.now().toString().slice(-8)}`;
    const order: Order = {
      id: orderId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: cart,
      subtotal: cartTotal,
      deliveryFee,
      serviceFee: SERVICE_FEE,
      vat: vatIncluded,
      total,
      address: mode === "delivery" ? address : `איסוף עצמי: ${restaurant.address}`,
      status: "placed",
      createdAt: new Date().toISOString(),
      pickupOrDelivery: mode,
    };
    addOrder(order);
    clearCart();
    setTimeout(() => router.push(`/order/${order.id}`), 400);
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
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05X-XXXXXXX"
            inputMode="tel"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-sm text-stone-700">אמצעי תשלום</h2>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="מספר כרטיס אשראי (הדגמה בלבד)"
            inputMode="numeric"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-stone-400">
            זהו אב-טיפוס להדגמה בלבד — לא מתבצע חיוב אמיתי ופרטי התשלום אינם
            נשמרים. באפליקציה חיה יחובר ספק סליקה מורשה בישראל בהתאם לתקן
            PCI DSS.
          </p>
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
          {placing ? "מבצע הזמנה..." : `בצעו הזמנה · ₪${total.toFixed(0)}`}
        </button>
      </div>
    </main>
  );
}
