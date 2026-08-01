"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Order } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  placed: "התקבלה",
  confirmed: "אושרה",
  preparing: "בהכנה",
  out_for_delivery: "בדרך אליכם",
  delivered: "נמסרה",
};

export default function OrdersPage() {
  const { customerId } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    fetch(`/api/orders?customerId=${encodeURIComponent(customerId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Order[]) => setOrders(data))
      .finally(() => setLoading(false));
  }, [customerId]);

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4">
      <h1 className="text-xl font-extrabold">ההזמנות שלי</h1>

      {!loading && orders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-stone-400 py-16">
          <span className="text-3xl">🧾</span>
          <p className="font-medium">עדיין אין הזמנות</p>
          <Link href="/home" className="mt-2 text-emerald-700 underline text-sm">
            הזמינו עכשיו
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/order/${o.id}`}
            className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-1"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-900">{o.restaurantName}</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  o.status === "delivered"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {STATUS_LABEL[o.status]}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {new Date(o.createdAt).toLocaleString("he-IL")}
            </p>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-stone-500">#{o.id}</span>
              <span className="font-semibold text-stone-900">
                ₪{o.total.toFixed(2)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
