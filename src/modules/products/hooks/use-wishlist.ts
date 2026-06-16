import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  stock: number;
  category?: {
    name: string;
  } | null;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem, authenticated?: boolean) => Promise<void>;
  removeItem: (id: string, authenticated?: boolean) => Promise<void>;
  toggleItem: (item: WishlistItem, authenticated?: boolean) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  syncAccount: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (item, authenticated) => {
        const currentItems = get().items;
        const exists = currentItems.find((i) => i.id === item.id);

        if (!exists) {
          set({ items: [...currentItems, item] });

          if (authenticated) {
            try {
              await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: item.id }),
              });
            } catch (error) {
              console.error("Failed to sync add to wishlist", error);
            }
          }
        }
      },

      removeItem: async (id, authenticated) => {
        set({ items: get().items.filter((item) => item.id !== id) });

        if (authenticated) {
          try {
            await fetch(`/api/wishlist/${id}`, {
              method: "DELETE",
            });
          } catch (error) {
            console.error("Failed to sync remove from wishlist", error);
          }
        }
      },

      toggleItem: async (item, authenticated) => {
        const currentItems = get().items;
        const exists = currentItems.find((i) => i.id === item.id);

        if (exists) {
          await get().removeItem(item.id, authenticated);
        } else {
          await get().addItem(item, authenticated);
        }
      },

      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      syncAccount: async () => {
        const localItems = get().items;
        if (localItems.length === 0) return;

        try {
          const response = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: localItems.map((i) => i.id) }),
          });

          if (response.ok) {
            // After syncing, fetch the combined list from DB
            await get().fetchWishlist();
          }
        } catch (error) {
          console.error("Wishlist sync error:", error);
        }
      },

      fetchWishlist: async () => {
        try {
          const response = await fetch("/api/wishlist");
          if (response.ok) {
            const dbItems = await response.json();
            set({ items: dbItems });
          }
        } catch (error) {
          console.error("Wishlist fetch error:", error);
        }
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
