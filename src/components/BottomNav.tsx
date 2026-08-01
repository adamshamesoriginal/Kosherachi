"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

const NAV_ITEMS = [
  { href: "/home", label: "בית", icon: "🏠" },
  { href: "/orders", label: "הזמנות", icon: "🧾" },
  { href: "/cart", label: "עגלה", icon: "🛒" },
  { href: "/more", label: "עוד", icon: "☰" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useApp();

  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-lg grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-emerald-700" : "text-neutral-500"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === "/cart" && cartCount > 0 && (
                <span className="absolute top-1 left-[calc(50%-2px)] translate-x-3 -translate-y-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] leading-4 text-center">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
