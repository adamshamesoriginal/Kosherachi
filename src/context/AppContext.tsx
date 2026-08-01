"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartItem, FoodType, KashrutLevel, MenuItem, Order, Restaurant } from "@/lib/types";

interface Preferences {
  kashrutLevels: KashrutLevel[];
  foodTypes: FoodType[];
  area: string | null;
  onboarded: boolean;
}

const DEFAULT_PREFS: Preferences = {
  kashrutLevels: [],
  foodTypes: [],
  area: null,
  onboarded: false,
};

interface AppContextValue {
  prefs: Preferences;
  setPrefs: (p: Partial<Preferences>) => void;
  completeOnboarding: (p: Omit<Preferences, "onboarded">) => void;

  cart: CartItem[];
  cartRestaurantId: string | null;
  addToCart: (restaurant: Restaurant, item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "koshergo_state_v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // One-time hydration from localStorage on mount; setState-in-effect is
  // intentional here since it syncs from an external store the server can't see.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.prefs) setPrefsState(parsed.prefs);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.orders) setOrders(parsed.orders);
      }
    } catch {
      // ignore corrupted local storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefs, cart, orders }));
  }, [prefs, cart, orders, hydrated]);

  const setPrefs = (p: Partial<Preferences>) =>
    setPrefsState((prev) => ({ ...prev, ...p }));

  const completeOnboarding = (p: Omit<Preferences, "onboarded">) =>
    setPrefsState({ ...p, onboarded: true });

  const cartRestaurantId = cart[0]?.restaurantId ?? null;

  const addToCart = (restaurant: Restaurant, item: MenuItem) => {
    setCart((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== restaurant.id) {
        return [{ restaurantId: restaurant.id, item, quantity: 1 }];
      }
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { restaurantId: restaurant.id, item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) =>
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));

  const updateQuantity = (itemId: string, quantity: number) =>
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => c.item.id !== itemId)
        : prev.map((c) => (c.item.id === itemId ? { ...c, quantity } : c))
    );

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);

  const updateOrderStatus = (orderId: string, status: Order["status"]) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

  return (
    <AppContext.Provider
      value={{
        prefs,
        setPrefs,
        completeOnboarding,
        cart,
        cartRestaurantId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        orders,
        addOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
