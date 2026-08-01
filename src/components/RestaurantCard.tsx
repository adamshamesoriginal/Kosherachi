import Link from "next/link";
import Image from "next/image";
import { Restaurant } from "@/lib/types";
import { KashrutBadge } from "./KashrutBadge";
import { isCertificateExpiringSoon } from "@/lib/data";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const expiringSoon = isCertificateExpiringSoon(restaurant.kashrut.expiryDate);

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="relative h-36 w-full bg-stone-100">
        <Image
          src={restaurant.imageUrl}
          alt={restaurant.name}
          fill
          sizes="512px"
          className="object-cover"
        />
        <div className="absolute top-2 right-2">
          <KashrutBadge level={restaurant.kashrut.level} size="sm" />
        </div>
        {expiringSoon && (
          <div className="absolute bottom-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-medium text-white">
            תוקף כשרות מתקרב
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-stone-900 leading-tight">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-0.5 text-sm shrink-0">
            <span className="text-amber-500">★</span>
            <span className="font-semibold">{restaurant.rating}</span>
          </div>
        </div>
        <p className="text-xs text-stone-500">{restaurant.cuisine.join(" · ")}</p>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>
            {restaurant.deliveryTimeMinutes[0]}-{restaurant.deliveryTimeMinutes[1]} דק׳
          </span>
          <span>·</span>
          <span>
            {restaurant.deliveryFee === 0
              ? "משלוח חינם"
              : `משלוח ₪${restaurant.deliveryFee}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
