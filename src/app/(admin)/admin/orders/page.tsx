import { prisma } from "@/lib/prisma";
import {
  Download,
  ShoppingBag,
  CreditCard,
  Clock,
  Truck,
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

  // 1. Parallel data fetching (High Performance)
  const [orders, stats] = await Promise.all([
    // A. Orders Fetching
    prisma.order.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { orderNumber: { contains: q, mode: "insensitive" } },
                  { user: { name: { contains: q, mode: "insensitive" } } },
                  { user: { email: { contains: q, mode: "insensitive" } } },
                  { name: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          status ? { status: status as OrderStatus } : {},
        ],
      },
      take: 50, // Increased limit for better management
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
  ]);

  // Status counts
  const pendingCount = await prisma.order.count({
    where: { status: "PENDING" },
  });
  const deliveredCount = await prisma.order.count({
    where: { status: "DELIVERED" },
  });

  const totalRevenue = stats._sum.totalAmount || 0;
  const totalOrders = stats._count._all || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 1. Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Track and manage all your store orders.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all shadow-sm dark:shadow-none active:scale-95">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col justify-between h-36 group hover:shadow-xl hover:shadow-gray-100/50 transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <CreditCard size={80} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform">
              <CreditCard size={20} />
            </div>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              +12%
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              ${totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Total Revenue
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col justify-between h-36 group hover:shadow-xl hover:shadow-gray-100/50 transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <ShoppingBag size={80} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{totalOrders}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Total Orders
            </p>
          </div>
        </div>

        {/* Pending Processing */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col justify-between h-36 group hover:shadow-xl hover:shadow-gray-100/50 transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <Clock size={80} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:rotate-12 transition-transform">
              <Clock size={20} />
            </div>
            {pendingCount > 0 && (
              <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{pendingCount}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Pending Processing
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col justify-between h-36 group hover:shadow-xl hover:shadow-gray-100/50 transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <Truck size={80} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
              <Truck size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {deliveredCount}
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Completed Orders
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Order Table Container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm dark:shadow-none overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50/30">
          {/* Search */}
          <div className="w-full lg:max-w-md">
            <AdminSearch placeholder="Search Order ID, Customer..." />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 lg:flex-none">
              <OrderStatusFilter />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {orders.length > 0 ? (
          <OrdersTable orders={orders} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-24 w-24 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] flex items-center justify-center mb-6">
              <ShoppingBag size={40} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No orders found</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">
              Your search did not return any results. Try adjusting your filters.
            </p>
          </div>
        )}

        {/* Pagination Footer */}
        {orders.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50/10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing{" "}
              <span className="text-gray-900 dark:text-white">{orders.length}</span>{" "}
              records
            </p>
            <div className="flex gap-2">
              <button
                disabled
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl cursor-not-allowed"
              >
                Prev
              </button>
              <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-95 transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
