import { RotateCcw } from "lucide-react";
import ReturnsManager from "@/modules/admin/components/returns-manager";

export const metadata = {
  title: "Returns & Refunds — Admin",
};

export default function AdminReturnsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <RotateCcw size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Returns & Refunds
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Review return requests, approve shipments, and process customer refunds
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Returns Management Table & Workflows */}
      <ReturnsManager />
    </div>
  );
}
