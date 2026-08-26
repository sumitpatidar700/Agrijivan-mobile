import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartContextType = {
  cartCount: number;
  cartItems: CartItem[];
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: { id: string; title: string; price: number; image?: string }, quantity?: number) => Promise<boolean>;
  updateQuantity: (id: string, change: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  removeItems: (ids: string[]) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cartItems: [],
  cartLoading: true,
  refreshCart: async () => {},
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeItem: async () => {},
  removeItems: async () => {},
  clearCart: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const userKey = (user as any)?.email || (user as any)?.phone || "guest";

  const refreshCart = useCallback(async () => {
    if (!user) { setCartItems([]); setCartLoading(false); return; }
    setCartLoading(true);
    try {
      // 1. Try to read from Supabase cart_items first
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await (supabase.from("cart_items") as any)
          .select("items")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Failed to fetch cart from Supabase, using local storage:", error.message);
        } else if (data) {
          const parsed = typeof data.items === "string" ? JSON.parse(data.items) : data.items;
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
            await AsyncStorage.setItem(`agrijivan-cart-${userKey}`, JSON.stringify(parsed));
            return;
          }
        }
      }

      // 2. Local fallback
      const raw = await AsyncStorage.getItem(`agrijivan-cart-${userKey}`);
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [user, userKey]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const persist = useCallback(async (updated: CartItem[]) => {
    setCartItems(updated);
    try {
      await AsyncStorage.setItem(`agrijivan-cart-${userKey}`, JSON.stringify(updated));
      const supabase = getSupabaseClient();
      if (supabase && user) {
        const { error } = await (supabase.from("cart_items") as any).upsert(
          {
            user_id: user.id,
            items: JSON.stringify(updated),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (error) {
          console.warn("Failed to sync cart to Supabase:", error.message);
        }
      }
    } catch (err) {
      console.warn("Failed to save cart:", err);
    }
  }, [user, userKey]);

  const addToCart = useCallback(
    async (item: { id: string; title: string; price: number; image?: string }, quantity: number = 1) => {
      if (!user) {
        alert("Please sign in to add items to your cart.");
        return false;
      }
      setCartItems((current) => {
        const existing = current.find((i) => i.id === item.id);
        const updated = existing
          ? current.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i))
          : [...current, { id: item.id, title: item.title, price: item.price, image: item.image, quantity }];
        persist(updated);
        return updated;
      });
      return true;
    },
    [user, persist],
  );

  const updateQuantity = useCallback(
    async (id: string, change: number) => {
      const updated = cartItems
        .map((item) => {
          if (item.id === id) {
            const qty = item.quantity + change;
            return qty > 0 ? { ...item, quantity: qty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
      await persist(updated);
    },
    [cartItems, persist],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await persist(cartItems.filter((item) => item.id !== id));
    },
    [cartItems, persist],
  );

  const removeItems = useCallback(
    async (ids: string[]) => {
      const idSet = new Set(ids);
      await persist(cartItems.filter((item) => !idSet.has(item.id)));
    },
    [cartItems, persist],
  );

  const clearCart = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartCount, cartItems, cartLoading, refreshCart, addToCart, updateQuantity, removeItem, removeItems, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
