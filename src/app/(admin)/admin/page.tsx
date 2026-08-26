import { prisma } from "@/lib/prisma";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  PieChart,
  Zap,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  Plus,
  LayoutDashboard,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
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

export const metadata = {
  title: "Admin Dashboard — Input Gears",
};

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userRole = session?.user?.role as UserRole;
  const adminName = session?.user?.name?.split(" ")[0] || "Admin";

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
          where: { status: { not: "CANCELLED" } },
        })
      : Promise.resolve({ _sum: { totalAmount: 0 } }),
    prisma.order.count(),
    prisma.product.count(),
    userRole === "SUPER_ADMIN"
      ? prisma.user.count({ where: { role: "USER" } })
      : Promise.resolve(0),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: { include: { product: true } } },
    }),
    prisma.product.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    userRole === "SUPER_ADMIN" ? getRevenueAnalytics() : Promise.resolve([]),
    getLowStockProducts(5),
  ]);

  const revenue = totalRevenue._sum.totalAmount ?? 0;

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(revenue),
      icon: DollarSign,
      desc: "Gross sales (excluding cancelled)",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-100 dark:border-indigo-900/40",
      trend: "+12.5%",
      isSuperAdminOnly: true,
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      desc: `${totalOrders} orders processed`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900/40",
      trend: "+8.2%",
      isSuperAdminOnly: false,
    },
    {
      title: "Active Products",
      value: totalProducts,
      icon: Package,
      desc: lowStockProducts.length > 0 ? `${lowStockProducts.length} low stock` : "In healthy stock",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/40",
      trend: `${totalProducts} live`,
      isSuperAdminOnly: false,
    },
    {
      title: "Customers",
      value: totalCustomers,
      icon: Users,
      desc: `${totalCustomers} registered shoppers`,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-100 dark:border-purple-900/40",
      trend: "+15.3%",
      isSuperAdminOnly: true,
    },
  ];

  const trafficDataLegend = [
    { source: "Direct", percent: 45, color: "bg-indigo-600" },
    { source: "Social", percent: 30, color: "bg-cyan-500" },
    { source: "Organic", percent: 15, color: "bg-amber-500" },
    { source: "Referral", percent: 10, color: "bg-pink-500" },
  ];

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Standard Top Header with Greetings on Left & Quick Actions on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Admin Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Welcome back, <strong className="text-gray-900 dark:text-white">{adminName}</strong>. Here&apos;s what&apos;s happening in your store today.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs active:scale-95"
          >
            <ExternalLink size={13} className="text-gray-400" />
            <span>Storefront</span>
          </Link>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs active:scale-95"
          >
            <ShoppingBag size={13} className="text-gray-400" />
            <span>Orders ({totalOrders})</span>
          </Link>

          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Low Stock Warning Alert (if any product is low on inventory) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2.5 rounded-lg shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm">
                Low Inventory Warning
              </h4>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                <strong>{lowStockProducts.length}</strong> product(s) have less than 5 units left in stock!
              </p>
            </div>
          </div>
          <Link
            href="/admin/products?stock=low-stock"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-2xs"
          >
            Review Inventory
          </Link>
        </div>
      )}

      {/* 3. Standard KPI Stats Grid (Optimized for Mobile & Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {stats.map((stat, i) => {
          if (stat.isSuperAdminOnly && userRole !== "SUPER_ADMIN") {
            return null;
          }
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 p-3.5 sm:p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs transition-all hover:border-gray-300 dark:hover:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl border", stat.bg, stat.border, stat.color)}>
                  <stat.icon size={16} className="sm:hidden" />
                  <stat.icon size={18} className="hidden sm:block" />
                </div>
                <span className="flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 px-1.5 sm:px-2 py-0.5 rounded-full">
                  <TrendingUp size={9} className="mr-0.5" /> {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5 sm:mt-1 tracking-tight">
                  {stat.value}
                </h3>
                <p className={cn(
                  "text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 truncate",
                  stat.title === "Active Products" && lowStockProducts.length > 0
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-gray-400"
                )}>
                  {stat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section (2 Columns): Revenue Analytics + Featured Catalog */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart Section */}
          {userRole === "SUPER_ADMIN" && (
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
              <div className="flex items-center justify-between mb-6 px-1 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    Revenue Overview
                  </h3>
                  <p className="text-xs text-gray-400">
                    Store sales analytics and monthly trajectory
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg text-xs font-bold border border-gray-200/80 dark:border-gray-700">
                  <span className="px-2.5 py-1 bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 rounded-md shadow-2xs cursor-pointer">
                    Weekly
                  </span>
                  <span className="px-2.5 py-1 text-gray-400 dark:text-gray-500 cursor-pointer">
                    Monthly
                  </span>
                </div>
              </div>
              <RevenueChart data={revenueAnalytics} />
            </div>
          )}

          {/* Catalog Highlights / Recent Products */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Zap className="text-amber-500 fill-amber-500" size={15} />
                <span>Featured Catalog Items</span>
              </h3>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                <span>View catalog</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/edit/${product.id}`}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200/80 dark:border-gray-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {product.category?.name || "General"} · <strong>{product.stock}</strong> units left
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                    ${product.price.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section (1 Column): Traffic Sources + Sales Goal */}
        <div className="space-y-6">
          {/* Traffic Sources */}
          {userRole === "SUPER_ADMIN" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Traffic Breakdown
                  </h3>
                  <p className="text-xs text-gray-400">Visitor referral distribution</p>
                </div>
                <PieChart size={18} className="text-indigo-600" />
              </div>

              <TrafficDonutChart />

              <div className="mt-4 space-y-2.5">
                {trafficDataLegend.map((data, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", data.color)} />
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {data.source}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {data.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Sales Target Box */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-5 text-white relative overflow-hidden shadow-sm">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <BarChart3 size={150} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Monthly Store Target</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-white/20 px-2.5 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5 opacity-80">
                Performance pacing vs store projection
              </p>

              <div className="mt-5 flex items-end justify-between">
                <h4 className="text-3xl font-black tracking-tight">75%</h4>
                <span className="text-xs font-semibold opacity-90">On track</span>
              </div>

              <div className="mt-2.5 w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-3/4" />
              </div>

              <p className="mt-4 text-[11px] leading-relaxed opacity-90">
                You have reached 75% of your target revenue this cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              Recent Store Orders
            </h3>
            <p className="text-xs text-gray-400">
              Latest checkouts and customer orders
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-indigo-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
          >
            <span>View All Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold font-mono text-xs text-gray-900 dark:text-white">
                        #{order.orderNumber.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {order.name || order.user?.name || "Guest Customer"}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate max-w-xs">
                          {order.email || order.user?.email || "No email"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          order.status === "DELIVERED" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40",
                          order.status === "PENDING" &&
                            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
                          order.status === "PROCESSING" &&
                            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40",
                          order.status === "SHIPPED" &&
                            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/40",
                          order.status === "CANCELLED" &&
                            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="View Orders"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
