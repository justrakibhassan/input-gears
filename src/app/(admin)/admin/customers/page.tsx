import { prisma } from "@/lib/prisma";
import {
  Users,
  Trophy,
  UserCheck,
  Download,
} from "lucide-react";

import AdminSearch from "@/modules/admin/components/admin-search";

import CustomersTable from "@/modules/admin/components/customers-table";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}) {
  const { q, sort, order } = await searchParams;

  // Sorting logic for Prisma
  const sortField = sort || "createdAt";
  const sortOrder = order || "desc";

  // 1. Fetch user data (with order history)
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["USER", "MANAGER", "CONTENT_EDITOR", "SUPER_ADMIN"] }, 
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      orders: {
        select: { totalAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { [sortField]: sortOrder },
  });

  // 2. Stats calculation (Simplified for cleaner UI)
  const totalCustomers = users.filter((u) => u.role === "USER").length;
  const activeCustomers = users.filter((u) => u.orders.length > 0).length;
  const newCustomersThisMonth = users.filter((u) => {
    const date = new Date(u.createdAt);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Customers{" "}
            <span className="text-indigo-600 text-sm align-top ml-1">
              Member Base
            </span>
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            Analyze behavior and manage relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white px-6 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all shadow-sm dark:shadow-none active:scale-95">
            <Download size={18} className="text-indigo-600" /> Export List
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Total Base",
            value: totalCustomers,
            icon: Users,
            color: "indigo",
          },
          {
            label: "Active Users",
            value: activeCustomers,
            icon: UserCheck,
            color: "emerald",
          },
          {
            label: "New Joiners",
            value: `+${newCustomersThisMonth}`,
            icon: Trophy,
            color: "purple",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-50 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center gap-5 group hover:shadow-lg dark:shadow-none transition-all duration-500"
          >
            <div
              className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform duration-500`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Management Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800 rounded-[40px] shadow-sm dark:shadow-none overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="w-full md:max-w-md">
            <AdminSearch placeholder="Search name, email, or digital ID..." />
          </div>
        </div>

        <CustomersTable customers={users} />
      </div>
    </div>
  );
}
