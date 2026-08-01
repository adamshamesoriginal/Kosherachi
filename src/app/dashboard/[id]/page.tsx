"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { KASHRUT_LEVELS, FOOD_TYPES, KashrutLevel, FoodType, MenuItem, Order, OrderStatus, Restaurant } from "@/lib/types";
import { nextStatus } from "@/lib/orderStatus";

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "התקבלה",
  confirmed: "אושרה",
  preparing: "בהכנה",
  out_for_delivery: "בדרך ללקוח",
  delivered: "נמסרה",
};

const NEXT_ACTION_LABEL: Record<OrderStatus, string> = {
  placed: "אישור הזמנה",
  confirmed: "התחלת הכנה",
  preparing: "יצא למשלוח",
  out_for_delivery: "סימון כנמסר",
  delivered: "",
};

type Tab = "orders" | "menu" | "settings";

export default function DashboardRestaurantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, authLoading } = useApp();
  const [tab, setTab] = useState<Tab>("orders");

  const owns = user?.ownedRestaurants.some((r) => r.id === params.id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/auth?next=/dashboard/${params.id}`);
  }, [authLoading, user, router, params.id]);

  if (authLoading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  if (!owns) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-stone-700">אין לכם גישה לעסק זה</p>
        <Link href="/dashboard" className="text-emerald-700 underline">
          חזרה לעסקים שלי
        </Link>
      </main>
    );
  }

  const restaurantName = user.ownedRestaurants.find((r) => r.id === params.id)?.name ?? "";

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <p className="text-xs text-stone-500">לוח בקרה</p>
        <h1 className="text-xl font-extrabold">{restaurantName}</h1>
      </header>

      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-4">
        <div className="flex gap-4">
          {[
            { id: "orders", label: "הזמנות" },
            { id: "menu", label: "תפריט" },
            { id: "settings", label: "פרטי העסק" },
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

      {tab === "orders" && <OrdersTab restaurantId={params.id} />}
      {tab === "menu" && <MenuTab restaurantId={params.id} />}
      {tab === "settings" && <SettingsTab restaurantId={params.id} />}
    </main>
  );
}

function OrdersTab({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = () => {
      fetch(`/api/dashboard/orders?restaurantId=${restaurantId}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Order[]) => {
          if (!cancelled) setOrders(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [restaurantId]);

  const advance = async (order: Order) => {
    const next = nextStatus(order.status);
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/dashboard/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-400">טוען הזמנות...</p>;
  }

  if (orders.length === 0) {
    return <p className="px-4 py-8 text-center text-stone-400">עדיין לא התקבלו הזמנות</p>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {orders.map((order) => {
        const next = nextStatus(order.status);
        return (
          <div key={order.id} className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-900">#{order.id}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {new Date(order.createdAt).toLocaleString("he-IL")}
            </p>
            <div className="flex flex-col gap-0.5 text-sm text-stone-600">
              {order.items.map((c) => (
                <div key={c.item.id} className="flex justify-between">
                  <span>{c.quantity} × {c.item.name}</span>
                  <span>₪{(c.item.price * c.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-100">
              <span>סה״כ</span>
              <span>₪{order.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-stone-500">
              {order.pickupOrDelivery === "delivery" ? "משלוח אל" : "איסוף מ"}: {order.address}
            </p>
            {next && (
              <button
                onClick={() => advance(order)}
                disabled={updatingId === order.id}
                className="mt-1 rounded-xl bg-emerald-700 text-white font-semibold py-2 text-sm disabled:opacity-40"
              >
                {updatingId === order.id ? "מעדכן..." : NEXT_ACTION_LABEL[order.status]}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MenuTab({ restaurantId }: { restaurantId: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    fetch(`/api/dashboard/restaurants/${restaurantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Restaurant | null) => setRestaurant(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [restaurantId]);

  const categories = useMemo(() => {
    if (!restaurant) return [];
    return Array.from(new Set(restaurant.menu.map((m) => m.category)));
  }, [restaurant]);

  const toggleAvailable = async (item: MenuItem) => {
    const nextAvailable = !item.available;
    // Optimistic update: the checkbox is controlled, so without this it would
    // snap back to its old state until the request resolves.
    setRestaurant((prev) =>
      prev
        ? {
            ...prev,
            menu: prev.menu.map((m) =>
              m.id === item.id ? { ...m, available: nextAvailable } : m
            ),
          }
        : prev
    );
    const res = await fetch(`/api/dashboard/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: nextAvailable }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurant((prev) =>
        prev
          ? { ...prev, menu: prev.menu.map((m) => (m.id === item.id ? updated : m)) }
          : prev
      );
    } else {
      // revert on failure
      setRestaurant((prev) =>
        prev
          ? {
              ...prev,
              menu: prev.menu.map((m) => (m.id === item.id ? item : m)),
            }
          : prev
      );
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-400">טוען תפריט...</p>;
  }
  if (!restaurant) {
    return <p className="px-4 py-8 text-center text-red-500">שגיאה בטעינת התפריט</p>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-6">
      <button
        onClick={() => setShowCreate((s) => !s)}
        className="rounded-xl border border-emerald-600 text-emerald-700 font-semibold py-2 text-sm"
      >
        {showCreate ? "סגירה" : "+ הוספת מנה חדשה"}
      </button>

      {showCreate && (
        <MenuItemCreateForm
          restaurantId={restaurantId}
          onCreated={(item) => {
            setRestaurant((prev) => (prev ? { ...prev, menu: [item, ...prev.menu] } : prev));
            setShowCreate(false);
          }}
        />
      )}

      {categories.map((cat) => (
        <div key={cat} className="flex flex-col gap-3">
          <h2 className="font-bold text-stone-900">{cat}</h2>
          {restaurant.menu
            .filter((m) => m.category === cat)
            .map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                onToggleAvailable={() => toggleAvailable(item)}
                onSaved={(updated) =>
                  setRestaurant((prev) =>
                    prev
                      ? { ...prev, menu: prev.menu.map((m) => (m.id === item.id ? updated : m)) }
                      : prev
                  )
                }
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function MenuItemRow({
  item,
  onToggleAvailable,
  onSaved,
}: {
  item: MenuItem;
  onToggleAvailable: () => void;
  onSaved: (item: MenuItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState(item.category);
  const [foodType, setFoodType] = useState<FoodType>(item.foodType);
  const [popular, setPopular] = useState(!!item.popular);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          category,
          foodType,
          popular,
        }),
      });
      if (res.ok) {
        onSaved(await res.json());
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col gap-2 ${
        item.available ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-100 opacity-70"
      }`}
    >
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-stone-900">{item.name}</h3>
              <p className="text-xs text-stone-500">{item.description}</p>
            </div>
            <span className="font-bold text-stone-900 shrink-0">₪{item.price}</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={!!item.available}
                onChange={onToggleAvailable}
                className="h-4 w-4"
              />
              זמין להזמנה
            </label>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-emerald-700"
            >
              עריכה
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="שם המנה"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="תיאור"
            rows={2}
          />
          <div className="flex gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
              placeholder="מחיר"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
              placeholder="קטגוריה"
            />
          </div>
          <select
            value={foodType}
            onChange={(e) => setFoodType(e.target.value as FoodType)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            {FOOD_TYPES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={popular}
              onChange={(e) => setPopular(e.target.checked)}
              className="h-4 w-4"
            />
            סמנו כמנה פופולרית
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-700 text-white font-semibold py-2 text-sm disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמירה"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-stone-300 text-stone-600 font-semibold py-2 text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemCreateForm({
  restaurantId,
  onCreated,
}: {
  restaurantId: string;
  onCreated: (item: MenuItem) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState<FoodType>("parve");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && description.trim() && category.trim() && Number(price) > 0;

  const create = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/restaurants/${restaurantId}/menu-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          category,
          foodType,
        }),
      });
      if (!res.ok) throw new Error("היצירה נכשלה");
      onCreated(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "היצירה נכשלה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex flex-col gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם המנה"
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="תיאור"
        rows={2}
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="מחיר בש״ח"
          className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="קטגוריה"
          className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      <select
        value={foodType}
        onChange={(e) => setFoodType(e.target.value as FoodType)}
        className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
      >
        {FOOD_TYPES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.emoji} {f.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={create}
        disabled={!canSubmit || saving}
        className="rounded-lg bg-emerald-700 text-white font-semibold py-2 text-sm disabled:opacity-40"
      >
        {saving ? "יוצר..." : "הוספת המנה"}
      </button>
    </div>
  );
}

function SettingsTab({ restaurantId }: { restaurantId: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [deliveryTimeMinLow, setDeliveryTimeMinLow] = useState("");
  const [deliveryTimeMinHigh, setDeliveryTimeMinHigh] = useState("");
  const [selfDelivery, setSelfDelivery] = useState(false);
  const [kashrutLevel, setKashrutLevel] = useState<KashrutLevel>("regular");
  const [certifyingBody, setCertifyingBody] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateExpiryDate, setCertificateExpiryDate] = useState("");

  useEffect(() => {
    fetch(`/api/dashboard/restaurants/${restaurantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Restaurant | null) => {
        if (!data) return;
        setRestaurant(data);
        setDeliveryFee(String(data.deliveryFee));
        setMinOrder(String(data.minOrder));
        setDeliveryTimeMinLow(String(data.deliveryTimeMinutes[0]));
        setDeliveryTimeMinHigh(String(data.deliveryTimeMinutes[1]));
        setSelfDelivery(data.selfDelivery);
        setKashrutLevel(data.kashrut.level);
        setCertifyingBody(data.kashrut.certifyingBody);
        setCertificateNumber(data.kashrut.certificateNumber);
        setCertificateExpiryDate(data.kashrut.expiryDate.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/dashboard/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryFee: Number(deliveryFee),
          minOrder: Number(minOrder),
          deliveryTimeMinLow: Number(deliveryTimeMinLow),
          deliveryTimeMinHigh: Number(deliveryTimeMinHigh),
          selfDelivery,
          kashrutLevel,
          certifyingBody,
          certificateNumber,
          certificateExpiryDate,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-400">טוען...</p>;
  }
  if (!restaurant) {
    return <p className="px-4 py-8 text-center text-red-500">שגיאה בטעינה</p>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-stone-900 text-sm">משלוח</h2>
        <div className="flex gap-2">
          <input
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            inputMode="decimal"
            placeholder="דמי משלוח (₪)"
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <input
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            inputMode="decimal"
            placeholder="מינימום הזמנה (₪)"
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={deliveryTimeMinLow}
            onChange={(e) => setDeliveryTimeMinLow(e.target.value)}
            inputMode="numeric"
            placeholder="זמן מינימלי (דק׳)"
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
          <input
            value={deliveryTimeMinHigh}
            onChange={(e) => setDeliveryTimeMinHigh(e.target.value)}
            inputMode="numeric"
            placeholder="זמן מקסימלי (דק׳)"
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={selfDelivery}
            onChange={(e) => setSelfDelivery(e.target.checked)}
            className="h-4 w-4"
          />
          המשלוח מתבצע על ידינו (לא שירות חיצוני)
        </label>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold text-stone-900 text-sm">כשרות</h2>
        <select
          value={kashrutLevel}
          onChange={(e) => setKashrutLevel(e.target.value as KashrutLevel)}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {KASHRUT_LEVELS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.emoji} {k.label}
            </option>
          ))}
        </select>
        <input
          value={certifyingBody}
          onChange={(e) => setCertifyingBody(e.target.value)}
          placeholder="גוף מפקח"
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          value={certificateNumber}
          onChange={(e) => setCertificateNumber(e.target.value)}
          placeholder="מספר תעודה"
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          תוקף התעודה
          <input
            type="date"
            value={certificateExpiryDate}
            onChange={(e) => setCertificateExpiryDate(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-[11px] text-stone-400">
          עדכון צילום תעודת הכשרות עדיין אינו נתמך בלוח הבקרה — לפנייה לתמיכה
          לצורך עדכון הצילום.
        </p>
      </section>

      {saved && <p className="text-sm text-emerald-700 text-center">נשמר בהצלחה</p>}

      <button
        onClick={save}
        disabled={saving}
        className="rounded-2xl bg-emerald-700 text-white font-bold py-3 disabled:opacity-40"
      >
        {saving ? "שומר..." : "שמירת שינויים"}
      </button>
    </div>
  );
}
