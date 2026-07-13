import { Tag, Plus } from "lucide-react";
import Link from "next/link";
import { getAllProductsForSaleManager } from "@/modules/admin/actions";
import SaleManager from "@/modules/admin/components/sale-manager";

export const metadata = {
  title: "Sale Manager — Admin",
};

export default async function AdminSalePage() {
  const result = await getAllProductsForSaleManager();
  const products = result.success ? (result.data ?? []) : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <Tag size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Sale Manager</h1>
            <p className="text-sm text-gray-500 font-medium">
              Mark products on sale, set prices and expiry dates
            </p>
          </div>
        </div>
        <Link
          href="/sale"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus size={16} />
          View Sale Page
        </Link>
      </div>

      {!result.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium">
          Failed to load products. Please refresh the page.
        </div>
      )}

      <SaleManager products={products} />
    </div>
  );
}
