"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartItem, FoodType, KashrutLevel, MenuItem, Restaurant } from "@/lib/types";

interface Preferences {
  kashrutLevels: KashrutLevel[];
  foodTypes: FoodType[];
  area: string | null;
  onboarded: boolean;
}

export interface AuthUser {
  id: string;
  phone: string;
  ownedRestaurants: { id: string; name: string }[];
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

  user: AuthUser | null;
  authLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;

  cart: CartItem[];
  cartRestaurantId: string | null;
  addToCart: (restaurant: Restaurant, item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "koshergo_state_v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
      return data.user as AuthUser | null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  // One-time hydration from localStorage + session cookie on mount; setState-in-effect
  // is intentional here since it syncs from external stores the server can't see.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.prefs) setPrefsState(parsed.prefs);
        if (parsed.cart) setCart(parsed.cart);
      }
    } catch {
      // ignore corrupted local storage
    }
    setHydrated(true);
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefs, cart }));
  }, [prefs, cart, hydrated]);

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

  return (
    <AppContext.Provider
      value={{
        prefs,
        setPrefs,
        completeOnboarding,
        user,
        authLoading,
        refreshUser,
        logout,
        cart,
        cartRestaurantId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
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
