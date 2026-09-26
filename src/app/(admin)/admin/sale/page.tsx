import { getAllProductsForSaleManager } from "@/modules/admin/actions";
import SaleManager from "@/modules/admin/components/sale-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sale Manager — Admin",
};

export default async function AdminSalePage() {
  const result = await getAllProductsForSaleManager();
  const products = result.success ? (result.data ?? []) : [];

  return (
    <div className="w-full space-y-6 pb-10">
      {!result.success && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl px-5 py-4 text-sm font-medium">
          Failed to load products. Please refresh the page.
        </div>
      )}

      <SaleManager products={products} />
    </div>
  );
}
