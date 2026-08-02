import { RotateCcw, Search, Clock, CheckCircle2, XCircle, DollarSign, Package } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Returns & Refunds — Admin",
};

const demoReturns = [
  {
    id: "RET-1001",
    orderNumber: "ORD-9842",
    customer: "Rahim Ahmed",
    email: "rahim@example.com",
    item: "Wireless Mechanical Keyboard (RGB)",
    reason: "Defective switch on spacebar",
    amount: 149.99,
    status: "PENDING",
    date: "2026-08-01",
  },
  {
    id: "RET-1002",
    orderNumber: "ORD-9810",
    customer: "Tanvir Hossain",
    email: "tanvir@example.com",
    item: "Ultra-Fast Ergonomic Gaming Mouse",
    reason: "Ordered wrong model size",
    amount: 79.50,
    status: "APPROVED",
    date: "2026-07-29",
  },
  {
    id: "RET-1003",
    orderNumber: "ORD-9755",
    customer: "Nusrat Jahan",
    email: "nusrat@example.com",
    item: "PBT Keycap Set (Retro Cyan)",
    reason: "Changed mind before unboxing",
    amount: 45.00,
    status: "REFUNDED",
    date: "2026-07-25",
  },
  {
    id: "RET-1004",
    orderNumber: "ORD-9690",
    customer: "Sajjad Karim",
    email: "sajjad@example.com",
    item: "Desk Mat (Minimalist Black)",
    reason: "Damaged during transit",
    amount: 29.99,
    status: "REJECTED",
    date: "2026-07-20",
  },
];

export default function AdminReturnsPage() {
  const pendingCount = demoReturns.filter((r) => r.status === "PENDING").length;
  const approvedCount = demoReturns.filter((r) => r.status === "APPROVED" || r.status === "REFUNDED").length;
  const totalRefunded = demoReturns
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <RotateCcw size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Returns & Refunds
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Manage product return requests, approvals, and customer refunds
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Pending Requests
            </p>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
            {pendingCount}
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
            Requires store review
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Approved / Processing
            </p>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {approvedCount}
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Items accepted for return
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Total Refunded
            </p>
            <DollarSign size={18} className="text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
            ${totalRefunded.toFixed(2)}
          </p>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
            Refunded to buyers
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-gray-100 dark:border-gray-800 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">
            Recent Return Requests
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            Showing {demoReturns.length} requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Return ID
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Customer & Order
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Product / Reason
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {demoReturns.map((ret) => (
                <tr
                  key={ret.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                    {ret.id}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {ret.customer}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                        {ret.orderNumber}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {ret.item}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {ret.reason}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-gray-900 dark:text-white">
                    ${ret.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ret.status === "PENDING"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          : ret.status === "APPROVED"
                          ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                          : ret.status === "REFUNDED"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {ret.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
