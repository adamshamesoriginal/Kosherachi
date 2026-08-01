"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { KashrutBadge } from "@/components/KashrutBadge";
import { FoodTypeBadge } from "@/components/FoodTypeBadge";
import { KashrutCertificateCard } from "@/components/KashrutCertificateCard";
import { MenuItemCustomizeSheet } from "@/components/MenuItemCustomizeSheet";
import { useApp } from "@/context/AppContext";
import { useRestaurant } from "@/hooks/useRestaurant";
import { MenuItem, SelectedOption } from "@/lib/types";

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, cart, cartRestaurantId, cartCount, cartTotal } = useApp();
  const [tab, setTab] = useState<"menu" | "kashrut" | "reviews">("menu");
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const { restaurant, loading, notFound } = useRestaurant(params.id);

  const categories = useMemo(() => {
    if (!restaurant) return [];
    const set = Array.from(new Set(restaurant.menu.map((m) => m.category)));
    return set;
  }, [restaurant]);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-stone-400">
        <p>טוען...</p>
      </main>
    );
  }

  if (notFound || !restaurant) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">המסעדה לא נמצאה</p>
        <Link href="/home" className="text-emerald-700 underline">
          חזרה לדף הבית
        </Link>
      </main>
    );
  }

  const willReplaceCart =
    cart.length > 0 && cartRestaurantId !== restaurant.id;

  const confirmReplaceCartIfNeeded = () => {
    if (!willReplaceCart) return true;
    return window.confirm(
      "יש לכם פריטים בעגלה ממסעדה אחרת. הוספת מנה זו תרוקן את העגלה הנוכחית. להמשיך?"
    );
  };

  const handleAdd = (item: MenuItem) => {
    if (item.options && item.options.length > 0) {
      if (!confirmReplaceCartIfNeeded()) return;
      setCustomizingItem(item);
      return;
    }
    if (!confirmReplaceCartIfNeeded()) return;
    addToCart(restaurant, item);
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1200);
  };

  const handleConfirmCustomization = (
    selectedOptions: SelectedOption[],
    note: string,
    quantity: number
  ) => {
    if (!customizingItem) return;
    addToCart(restaurant, customizingItem, { selectedOptions, note, quantity });
    setAddedItemId(customizingItem.id);
    setCustomizingItem(null);
    setTimeout(() => setAddedItemId(null), 1200);
  };

  return (
    <main className="flex-1 flex flex-col pb-24">
      <div className="relative h-48 w-full bg-stone-100">
        <Image
          src={restaurant.imageUrl}
          alt={restaurant.name}
          fill
          sizes="512px"
          className="object-cover"
          priority
        />
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow"
        >
          ←
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-stone-900">
              {restaurant.name}
            </h1>
            <p className="text-sm text-stone-500">
              {restaurant.cuisine.join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm shrink-0">
            <span className="text-amber-500">★</span>
            <span className="font-semibold">{restaurant.rating}</span>
            <span className="text-stone-400">({restaurant.reviewCount})</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <KashrutBadge level={restaurant.kashrut.level} />
          {restaurant.foodTypes.map((ft) => (
            <FoodTypeBadge key={ft} type={ft} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs text-stone-600 bg-white rounded-xl border border-stone-200 py-3">
          <div>
            <p className="font-bold text-stone-900">
              {restaurant.deliveryTimeMinutes[0]}-{restaurant.deliveryTimeMinutes[1]}
            </p>
            <p>דקות</p>
          </div>
          <div className="border-x border-stone-100">
            <p className="font-bold text-stone-900">
              {restaurant.deliveryFee === 0 ? "חינם" : `₪${restaurant.deliveryFee}`}
            </p>
            <p>משלוח</p>
          </div>
          <div>
            <p className="font-bold text-stone-900">₪{restaurant.minOrder}</p>
            <p>מינימום הזמנה</p>
          </div>
        </div>

        <p className="text-xs text-stone-500">
          {restaurant.selfDelivery
            ? "🚗 המשלוח מתבצע ישירות על ידי בית העסק"
            : "📦 המשלוח באמצעות שירות משלוחים חיצוני"}
          {" · "}
          {restaurant.address}
        </p>
      </div>

      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-4">
        <div className="flex gap-4">
          {[
            { id: "menu", label: "תפריט" },
            { id: "kashrut", label: "כשרות" },
            { id: "reviews", label: "ביקורות" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
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

      {tab === "menu" && (
        <div className="px-4 py-4 flex flex-col gap-6">
          {categories.map((cat) => (
            <div key={cat} className="flex flex-col gap-3">
              <h2 className="font-bold text-stone-900">{cat}</h2>
              {restaurant.menu
                .filter((m) => m.category === cat)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-stone-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-stone-900 truncate">
                          {item.name}
                        </h3>
                        {item.popular && (
                          <span className="text-[10px] shrink-0 rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 font-medium">
                            פופולרי
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-bold text-stone-900">
                          ₪{item.price}
                        </span>
                        <button
                          onClick={() => handleAdd(item)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                            addedItemId === item.id
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {addedItemId === item.id
                            ? "נוסף ✓"
                            : item.options && item.options.length > 0
                              ? "התאמה אישית"
                              : "+ הוספה"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {tab === "kashrut" && (
        <div className="px-4 py-4">
          <KashrutCertificateCard cert={restaurant.kashrut} />
        </div>
      )}

      {tab === "reviews" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          {restaurant.reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-stone-200 bg-white p-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900 text-sm">
                  {rev.userName}
                </span>
                <span className="text-amber-500 text-sm">
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(5 - rev.rating)}
                </span>
              </div>
              <p className="text-sm text-stone-600">{rev.comment}</p>
              <p className="text-xs text-stone-400">
                {new Date(rev.date).toLocaleDateString("he-IL")}
              </p>
            </div>
          ))}
        </div>
      )}

      {cartCount > 0 && cartRestaurantId === restaurant.id && (
        <div className="fixed bottom-16 inset-x-0 z-30 px-4">
          <Link
            href="/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-emerald-700 px-5 py-3.5 text-white shadow-lg shadow-emerald-900/30"
          >
            <span className="font-bold">צפייה בעגלה · {cartCount} פריטים</span>
            <span className="font-bold">₪{cartTotal.toFixed(0)}</span>
          </Link>
        </div>
      )}

      {customizingItem && (
        <MenuItemCustomizeSheet
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </main>
  );
}
