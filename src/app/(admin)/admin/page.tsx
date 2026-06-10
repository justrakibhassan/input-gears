import { prisma } from "@/lib/prisma";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  PieChart,
  MoreHorizontal,
  Zap,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  RevenueChart,
  TrafficDonutChart,
} from "@/modules/admin/components/dashboard-charts";
import {
  getLowStockProducts,
  getRevenueAnalytics,
} from "@/modules/admin/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@prisma/client";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userRole = session?.user?.role as UserRole;

  // 1. Parallel data fetching
  const [
    totalRevenue,
    totalOrders,
    totalProducts,
    totalCustomers,
    recentOrders,
    trendingProducts,
    revenueAnalytics,
    lowStockProducts,
  ] = await Promise.all([
    userRole === "SUPER_ADMIN" 
      ? prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: "PAID" },
        })
      : Promise.resolve({ _sum: { totalAmount: 0 } }),
    prisma.order.count(),
    prisma.product.count(),
    userRole === "SUPER_ADMIN" 
      ? prisma.user.count({ where: { role: "USER" } })
      : Promise.resolve(0),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.product.findMany({
      take: 4,
    }),
    userRole === "SUPER_ADMIN" ? getRevenueAnalytics() : Promise.resolve([]),
    getLowStockProducts(5),
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;

  const stats = [
    {
      title: "Total Revenue",
      value: `$${revenue.toLocaleString()}`,
      icon: DollarSign,
      desc: "+20.1% from last month",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      desc: "+180 since last hour",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Products",
      value: totalProducts,
      icon: Package,
      desc: "12 products low stock",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Customers",
      value: totalCustomers,
      icon: Users,
      desc: "+19 new this week",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const trafficDataLegend = [
    { source: "Direct", percent: 45, color: "bg-indigo-600" },
    { source: "Social", percent: 30, color: "bg-cyan-500" },
    { source: "Organic", percent: 15, color: "bg-amber-500" },
    { source: "Referral", percent: 10, color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Low Stock Alerts --- */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[24px] p-6 flex items-center justify-between shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-2xl text-white animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-red-900 font-black uppercase tracking-tight">
                Low Stock Warning
              </h4>
              <p className="text-red-700 text-xs font-bold uppercase tracking-widest mt-0.5">
                {lowStockProducts.length} products have less than 5 units left!
              </p>
            </div>
          </div>
          <Link
            href="/admin/products?stock=low-stock"
            className="px-5 py-2.5 bg-red-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg dark:shadow-none active:scale-95"
          >
            Review Inventory
          </Link>
        </div>
      )}

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          // Hide Revenue and Customers for non-admins
          if ((stat.title === "Total Revenue" || stat.title === "Customers") && userRole !== "SUPER_ADMIN") {
            return null;
          }
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-gray-100/50 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <stat.icon size={80} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div
                  className={`p-3 rounded-2xl ${stat.bg} group-hover:rotate-12 transition-transform`}
                >
                  <stat.icon size={24} className={stat.color} />
                </div>
                <span className="flex items-center text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <TrendingUp size={12} className="mr-1" /> 12%
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
                  {stat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart Section */}
          {userRole === "SUPER_ADMIN" && (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-8 px-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                    Revenue Overview
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Monthly earning statistics
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Revenue
                    </span>
                  </div>
                </div>
              </div>
              <RevenueChart data={revenueAnalytics} />
            </div>
          )}

          {/* Trending Products */}
          <div>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2 uppercase">
                <Zap className="text-yellow-500 fill-yellow-500" size={18} />
                Trending Products
              </h3>
              <Link
                href="/admin/products"
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none hover:border-indigo-200 hover:shadow-lg dark:shadow-none transition-all group cursor-pointer"
                >
                  <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-[18px] relative overflow-hidden shrink-0 border border-gray-50 dark:border-gray-800">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-300 font-black">
                        NOPIC
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-black text-indigo-600">
                        ${product.price}
                      </span>
                      <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        24 sales
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-45 transition-all shadow-sm dark:shadow-none">
                    <ArrowRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section (1 Column) */}
        <div className="space-y-8">
          {/* Traffic Source Donut */}
          {userRole === "SUPER_ADMIN" && (
            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg">
                  Traffic
                </h3>
                <PieChart size={20} className="text-indigo-600" />
              </div>

              <TrafficDonutChart />

              <div className="mt-8 space-y-4">
                {trafficDataLegend.map((data, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${data.color} ring-4 ring-transparent group-hover:ring-gray-50 transition-all`}
                      />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {data.source}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                      {data.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions / Monthly Goal */}
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <BarChart3 size={200} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-lg uppercase tracking-tight">
                Monthly Goal
              </h3>
              <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest mt-1 opacity-80">
                Sales Target progress
              </p>

              <div className="mt-8 flex items-end justify-between">
                <h4 className="text-4xl font-black tracking-tighter">75%</h4>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-900/20 px-3 py-1 rounded-full">
                  On Track
                </span>
              </div>

              <div className="mt-4 w-full h-3 bg-white dark:bg-gray-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-white dark:bg-gray-900 w-3/4 rounded-full" />
              </div>

              <p className="mt-6 text-[11px] leading-relaxed font-bold opacity-90">
                You have reached 75% of your monthly sales goal. Keep the
                momentum going!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
              Recent Transactions
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Live updates from your store
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="group flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg dark:shadow-none shadow-gray-200"
          >
            View All Orders{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50/50 text-gray-400 border-b border-gray-50 dark:border-gray-800">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                  Order
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                  Customer
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="px-8 py-5">
                    <span className="font-black text-gray-900 dark:text-white text-sm">
                      #{order.orderNumber.slice(-6)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {order.name || order.user?.name || "Guest User"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {new Date(order.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-indigo-600">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${
                          order.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : order.status === "DELIVERED"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="h-9 w-9 inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white dark:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all">
                      <MoreHorizontal size={18} />
                    </button>
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
