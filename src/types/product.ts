import {
  Product as PrismaProduct,
  Category as PrismaCategory,
} from "@prisma/client";

export interface Category extends PrismaCategory {
  products?: Product[];
}

export interface Product extends Omit<PrismaProduct, "specs" | "image"> {
  category?: Category | null;
  image: string | null;
  images?: string[]; // Optional array for UI components that prefer it
  
  // These fields are already in Prisma, but sometimes TS doesn't pick them up
  // accurately from the Omit/Pick chain if the client isn't fully synced.
  colors: string[];
  switchType: string | null;
  brand: string | null;
  sku: string | null;
  dpi: string | null;
  weight: string | null;
  connectionType: string | null;
  pollingRate: string | null;
  sensor: string | null;
  warranty: string | null;
  availability: string | null;
  isActive: boolean;
  scheduledAt: Date | null;
  // Sale fields
  isOnSale: boolean;
  salePrice: number | null;
  saleEndDate: Date | null;
  
  // Specs is a JSON field in Prisma, we type it for our application use
  specs: Record<string, string | number | boolean | null> | null;
}

export type ProductWithCategory = Product & {
  category: Category | null;
};
