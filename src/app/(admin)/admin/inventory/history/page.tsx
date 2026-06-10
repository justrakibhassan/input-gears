import StockLogsView from "@/modules/admin/components/stock-logs-view";
import { getStockLogs } from "@/modules/admin/actions";
import Link from "next/link";
import { ArrowLeft, Box } from "lucide-react";

export default async function InventoryHistoryPage() {
  const logs = await getStockLogs(100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
            Inventory Logs
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Link
              href="/admin/products"
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              Back to Products
            </Link>
            <span className="w-1 h-1 bg-gray-200 rounded-full" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              History
            </span>
          </div>
        </div>

        <Link
          href="/admin/products"
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg dark:shadow-none active:scale-95 shadow-indigo-100"
        >
          <Box size={16} />
          Manage Stock
        </Link>
      </div>

      <StockLogsView logs={logs} />
    </div>
  );
}
