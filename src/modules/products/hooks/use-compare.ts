import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { Product } from "@/modules/products/types";

// We use a subset of Product for the storage to keep it lightweight
export interface CompareItem extends Partial<Product> {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  updateItems: (items: CompareItem[]) => void;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const currentItems = get().items;
        
        if (currentItems.length >= 4) {
          toast.error("Comparison limit reached", {
            description: "You can compare up to 4 items at once."
          });
          return;
        }

        const exists = currentItems.find((i) => i.id === item.id);

        if (!exists) {
          set({ items: [...currentItems, item] });
          toast.success("Added to comparison", {
            description: `${item.name} added to compare list.`
          });
        } else {
          toast.info("Item already in comparison");
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
        toast.info("Removed from comparison");
      },

      isInCompare: (id) => {
        return get().items.some((item) => item.id === id);
      },

      clearCompare: () => {
        set({ items: [] });
      },

      updateItems: (items) => {
        set({ items });
      },
    }),
    {
      name: "compare-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
