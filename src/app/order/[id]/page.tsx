"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/lib/types";

const STATUS_FLOW: { id: OrderStatus; label: string; icon: string }[] = [
  { id: "placed", label: "ההזמנה התקבלה", icon: "🧾" },
  { id: "confirmed", label: "המסעדה אישרה", icon: "✅" },
  { id: "preparing", label: "בהכנה", icon: "👨‍🍳" },
  { id: "out_for_delivery", label: "בדרך אליכם", icon: "🛵" },
  { id: "delivered", label: "נמסר", icon: "🎉" },
];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = () => {
      fetch(`/api/orders/${params.id}`)
        .then((res) => {
          if (res.status === 401) {
            if (!cancelled) setUnauthorized(true);
            return null;
          }
          if (res.status === 404 || res.status === 403) {
            if (!cancelled) setNotFound(true);
            return null;
          }
          if (!res.ok) throw new Error("Failed to load order");
          return res.json();
        })
        .then((data: Order | null) => {
          if (data && !cancelled) setOrder(data);
        })
        .catch(() => {
          if (!cancelled) setNotFound(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchOrder();
    // Status is computed server-side from elapsed time, so we poll to reflect it live.
    const interval = setInterval(fetchOrder, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.id]);

  useEffect(() => {
    if (unauthorized) router.replace(`/auth?next=/order/${params.id}`);
  }, [unauthorized, router, params.id]);

  if (loading || unauthorized) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-stone-700">ההזמנה לא נמצאה</p>
        <Link href="/home" className="text-emerald-700 underline">
          חזרה לדף הבית
        </Link>
      </main>
    );
  }

  const currentIndex = STATUS_FLOW.findIndex((s) => s.id === order.status);

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-6">
      <div>
        <p className="text-sm text-stone-500">הזמנה #{order.id}</p>
        <h1 className="text-xl font-extrabold">{order.restaurantName}</h1>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-5">
        {STATUS_FLOW.map((s, i) => {
          const active = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm ${
                  active ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    active ? "text-stone-900" : "text-stone-400"
                  }`}
                >
                  {s.label}
                </p>
                {isCurrent && s.id !== "delivered" && (
                  <p className="text-xs text-emerald-600">מתעדכן...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-2">
        <h2 className="font-bold text-stone-900">פרטי ההזמנה</h2>
        {order.items.map((c) => (
          <div key={c.item.id} className="flex justify-between text-sm text-stone-600">
            <span>
              {c.quantity} × {c.item.name}
            </span>
            <span>₪{(c.item.price * c.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-stone-900 pt-2 mt-1 border-t border-stone-100">
          <span>סה״כ</span>
          <span>₪{order.total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-stone-500 pt-1">
          {order.pickupOrDelivery === "delivery" ? "משלוח אל" : "איסוף מ"}: {order.address}
        </p>
      </div>

      <Link
        href="/home"
        className="text-center rounded-2xl border border-stone-300 py-3 font-semibold text-stone-600"
      >
        חזרה לתפריט המסעדות
      </Link>
    </main>
  );
}
