import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  quantity: number;
  maxStock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem, authenticated?: boolean) => Promise<void>;
  removeItem: (id: string, authenticated?: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number, authenticated?: boolean) => Promise<void>;
  clearCart: () => void;
  syncAccount: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (data, authenticated) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === data.id);

        if (existingItem) {
          if (existingItem.quantity + 1 > existingItem.maxStock) {
            toast.error("Out of stock limit reached!");
            return;
          }
          const newQuantity = existingItem.quantity + 1;
          set({
            items: currentItems.map((item) =>
              item.id === data.id
                ? { ...item, quantity: newQuantity }
                : item
            ),
          });

          if (authenticated) {
            try {
              await fetch(`/api/cart/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: newQuantity }),
              });
            } catch (error) {
              console.error("Failed to sync cart update", error);
            }
          }
        } else {
          set({ items: [...get().items, { ...data, quantity: 1 }] });
          toast.success("Product added to cart 🛒");

          if (authenticated) {
            try {
              await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: data.id, quantity: 1 }),
              });
            } catch (error) {
              console.error("Failed to sync cart add", error);
            }
          }
        }
      },

      updateQuantity: async (id, quantity, authenticated) => {
        const item = get().items.find((i) => i.id === id);
        if (item && quantity > item.maxStock) {
          toast.error(`Only ${item.maxStock} items available in stock`);
          return;
        }
        if (quantity < 1) return;

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity: quantity } : item
          ),
        });

        if (authenticated) {
          try {
            await fetch(`/api/cart/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantity }),
            });
          } catch (error) {
            console.error("Failed to sync cart update", error);
          }
        }
      },

      removeItem: async (id, authenticated) => {
        set({ items: get().items.filter((item) => item.id !== id) });

        if (authenticated) {
          try {
            await fetch(`/api/cart/${id}`, {
              method: "DELETE",
            });
          } catch (error) {
            console.error("Failed to sync cart remove", error);
          }
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      syncAccount: async () => {
        const localItems = get().items;
        if (localItems.length === 0) return;

        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: localItems }),
          });

          if (response.ok) {
            await get().fetchCart();
          }
        } catch (error) {
          console.error("Cart sync error:", error);
        }
      },

      fetchCart: async () => {
        try {
          const response = await fetch("/api/cart");
          if (response.ok) {
            const dbItems = await response.json();
            set({ items: dbItems });
          }
        } catch (error) {
          console.error("Cart fetch error:", error);
        }
      },
    }),
    {
      name: "shopping-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
