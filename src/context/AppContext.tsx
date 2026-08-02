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
import { CartItem, FoodType, KashrutLevel, MenuItem, Restaurant, SelectedOption } from "@/lib/types";

interface Preferences {
  kashrutLevels: KashrutLevel[];
  foodTypes: FoodType[];
  area: string | null;
  onboarded: boolean;
}

export interface AuthUser {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  ownedRestaurants: { id: string; name: string }[];
  isAdmin: boolean;
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
  addToCart: (
    restaurant: Restaurant,
    item: MenuItem,
    customization?: { selectedOptions: SelectedOption[]; note?: string; quantity?: number }
  ) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "koshergo_state_v1";

// Two cart lines are the "same" line (quantity merges) only if they're the
// same menu item with the exact same selected options and note — a falafel
// with extra tehina is a different line from a falafel with none, even
// though both are the same MenuItem.
function cartLineKey(itemId: string, selectedOptions: SelectedOption[], note: string) {
  const optionsKey = [...selectedOptions]
    .map((o) => o.choiceId)
    .sort()
    .join(",");
  return `${itemId}::${optionsKey}::${note.trim()}`;
}

// Carts saved to localStorage before customization support was added are
// missing lineId/unitPrice/selectedOptions/note — reconstruct them instead
// of crashing the cart page on old data. Also drops anything too malformed
// to recover (no item/restaurantId at all).
function normalizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const result: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const c = entry as Partial<CartItem> & { item?: MenuItem; restaurantId?: string };
    if (!c.item || !c.restaurantId || typeof c.quantity !== "number") continue;
    const selectedOptions = Array.isArray(c.selectedOptions) ? c.selectedOptions : [];
    const note = typeof c.note === "string" ? c.note : "";
    const unitPrice =
      typeof c.unitPrice === "number"
        ? c.unitPrice
        : c.item.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
    const lineId = typeof c.lineId === "string" ? c.lineId : cartLineKey(c.item.id, selectedOptions, note);
    result.push({
      lineId,
      restaurantId: c.restaurantId,
      item: c.item,
      quantity: c.quantity,
      unitPrice,
      selectedOptions,
      note,
    });
  }
  return result;
}

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
        if (parsed.cart) setCart(normalizeStoredCart(parsed.cart));
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

  const addToCart = (
    restaurant: Restaurant,
    item: MenuItem,
    customization?: { selectedOptions: SelectedOption[]; note?: string; quantity?: number }
  ) => {
    const selectedOptions = customization?.selectedOptions ?? [];
    const note = customization?.note ?? "";
    const addQuantity = Math.max(1, customization?.quantity ?? 1);
    const unitPrice =
      item.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
    const lineId = cartLineKey(item.id, selectedOptions, note);

    setCart((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== restaurant.id) {
        return [{ lineId, restaurantId: restaurant.id, item, quantity: addQuantity, unitPrice, selectedOptions, note }];
      }
      const existing = prev.find((c) => c.lineId === lineId);
      if (existing) {
        return prev.map((c) =>
          c.lineId === lineId ? { ...c, quantity: c.quantity + addQuantity } : c
        );
      }
      return [...prev, { lineId, restaurantId: restaurant.id, item, quantity: addQuantity, unitPrice, selectedOptions, note }];
    });
  };

  const removeFromCart = (lineId: string) =>
    setCart((prev) => prev.filter((c) => c.lineId !== lineId));

  const updateQuantity = (lineId: string, quantity: number) =>
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => c.lineId !== lineId)
        : prev.map((c) => (c.lineId === lineId ? { ...c, quantity } : c))
    );

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0),
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
