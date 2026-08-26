import { prisma } from "@/lib/prisma";
import {
  Download,
  ShoppingBag,
} from "lucide-react";
import AdminSearch from "@/modules/admin/components/admin-search";
import OrderStatusFilter from "@/modules/admin/components/order-status-filter";
import { OrderStatus, Prisma } from "@prisma/client";
import OrdersTable from "@/modules/admin/components/orders-table";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; order?: string }>;
}) {
  const { q, status, sort = "createdAt", order = "desc" } = await searchParams;

  // Sorting logic mapping
  const validSortFields = [
    "orderNumber",
    "name",
    "createdAt",
    "totalAmount",
    "status",
    "paymentStatus",
  ];
  
  const sortField = validSortFields.includes(sort) ? sort : "createdAt";
  const sortOrder: Prisma.SortOrder = order === "asc" ? "asc" : "desc";

  const searchFilter = q
    ? {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" as const } },
          { user: { name: { contains: q, mode: "insensitive" as const } } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Parallel data fetching for performance & live badge counts
  const [
    orders,
    stats,
    allCount,
    pendingCount,
    processingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
  ] = await Promise.all([
    // A. Orders Fetching
    prisma.order.findMany({
      where: {
        AND: [
          searchFilter,
          status ? { status: status as OrderStatus } : {},
        ],
      },
      take: 50,
      orderBy: { [sortField]: sortOrder },
      include: {
        user: true,
      },
    }),

    // B. Aggregated Stats Calculation
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    // Status Live Counts
    prisma.order.count({ where: searchFilter }),
    prisma.order.count({ where: { status: "PENDING", ...searchFilter } }),
    prisma.order.count({ where: { status: "PROCESSING", ...searchFilter } }),
    prisma.order.count({ where: { status: "SHIPPED", ...searchFilter } }),
    prisma.order.count({ where: { status: "DELIVERED", ...searchFilter } }),
    prisma.order.count({ where: { status: "CANCELLED", ...searchFilter } }),
  ]);

  const totalRevenue = stats._sum.totalAmount || 0;
  const totalOrders = stats._count._all || 0;

  const counts = {
    ALL: allCount,
    PENDING: pendingCount,
    PROCESSING: processingCount,
    SHIPPED: shippedCount,
    DELIVERED: deliveredCount,
    CANCELLED: cancelledCount,
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Orders Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Track and manage all your store customer orders and fulfillment
            </p>
          </div>
        </div>

        {/* Right Side: Total Orders, Pending, Total Revenue Badges + Export CSV */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total Orders:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {totalOrders}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Pending:
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {pendingCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Total Revenue:
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300">
              ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs active:scale-95 cursor-pointer">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <OrderStatusFilter counts={counts} />

        <div className="relative min-w-[220px] sm:w-72">
          <AdminSearch placeholder="Search Order ID, customer, email..." />
        </div>
      </div>

      {/* 3. Actionable Orders Table (Full Width) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        {orders.length > 0 ? (
          <OrdersTable orders={orders} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 bg-gray-50 dark:bg-gray-800/60 rounded-2xl flex items-center justify-center mb-3">
              <ShoppingBag size={26} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              No orders found
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Your search or filter did not match any orders. Try adjusting your filters.
            </p>
          </div>
        )}

        {/* Pagination Footer */}
        {orders.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{orders.length}</span> records
            </p>
            <div className="flex gap-2">
              <button
                disabled
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg cursor-not-allowed"
              >
                Prev
              </button>
              <button className="px-3.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all cursor-pointer">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
