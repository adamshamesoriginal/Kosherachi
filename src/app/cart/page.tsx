"use client";

import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { getRestaurantById } from "@/lib/data";

export default function CartPage() {
  const { cart, cartRestaurantId, updateQuantity, removeFromCart, cartTotal } =
    useApp();
  const restaurant = cartRestaurantId ? getRestaurantById(cartRestaurantId) : null;

  if (cart.length === 0 || !restaurant) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">🛒</span>
        <p className="font-semibold text-stone-700">העגלה שלכם ריקה</p>
        <Link
          href="/home"
          className="mt-2 rounded-2xl bg-emerald-700 text-white font-bold px-6 py-3"
        >
          לתפריט המסעדות
        </Link>
      </main>
    );
  }

  const belowMinimum = cartTotal < restaurant.minOrder;

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-extrabold">העגלה שלי</h1>
        <p className="text-sm text-stone-500">{restaurant.name}</p>
      </header>

      <div className="px-4 flex flex-col gap-3">
        {cart.map((c) => (
          <div
            key={c.item.id}
            className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3"
          >
            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-stone-100">
              <Image
                src={c.item.imageUrl}
                alt={c.item.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <h3 className="font-semibold text-stone-900 text-sm truncate">
                {c.item.name}
              </h3>
              <p className="text-xs text-stone-500">₪{c.item.price} ליחידה</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(c.item.id, c.quantity - 1)}
                    className="h-7 w-7 rounded-full bg-stone-100 font-bold text-stone-600"
                  >
                    −
                  </button>
                  <span className="font-semibold w-4 text-center">
                    {c.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(c.item.id, c.quantity + 1)}
                    className="h-7 w-7 rounded-full bg-stone-100 font-bold text-stone-600"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-stone-900">
                  ₪{(c.item.price * c.quantity).toFixed(0)}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeFromCart(c.item.id)}
              className="text-stone-300 self-start text-lg"
              aria-label="הסרה"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 mt-6 flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 mx-4">
        <div className="flex justify-between text-sm text-stone-600">
          <span>סכום ביניים</span>
          <span>₪{cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-stone-600">
          <span>דמי משלוח</span>
          <span>
            {restaurant.deliveryFee === 0
              ? "חינם"
              : `₪${restaurant.deliveryFee.toFixed(2)}`}
          </span>
        </div>
        <p className="text-[11px] text-stone-400">
          המחירים כוללים מע״מ כחוק. חשבונית תישלח לאחר ביצוע ההזמנה.
        </p>
      </div>

      {belowMinimum && (
        <p className="px-4 mt-3 text-sm text-amber-600 text-center">
          נדרש מינימום הזמנה של ₪{restaurant.minOrder} ({restaurant.name})
        </p>
      )}

      <div className="mt-auto px-4 py-4">
        <Link
          href={belowMinimum ? "#" : "/checkout"}
          aria-disabled={belowMinimum}
          className={`block text-center rounded-2xl py-3.5 font-bold text-white ${
            belowMinimum
              ? "bg-stone-300 pointer-events-none"
              : "bg-emerald-700 shadow-md shadow-emerald-900/20"
          }`}
        >
          המשך לתשלום · ₪{cartTotal.toFixed(0)}
        </Link>
      </div>
    </main>
  );
}
