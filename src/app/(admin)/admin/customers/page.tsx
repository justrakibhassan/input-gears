import { prisma } from "@/lib/prisma";
import {
  Users,
} from "lucide-react";

import AdminSearch from "@/modules/admin/components/admin-search";
import CustomerRoleFilter from "@/modules/admin/components/customer-role-filter";
import CustomersTable from "@/modules/admin/components/customers-table";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; sort?: string; order?: string }>;
}) {
  const { q, role, sort, order } = await searchParams;

  // Sorting logic for Prisma
  const sortField = sort || "createdAt";
  const sortOrder = order || "desc";

  const searchFilter = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  let roleFilter = {};
  if (role === "USER") {
    roleFilter = { role: "USER" };
  } else if (role === "STAFF") {
    roleFilter = { role: { in: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"] } };
  } else if (role === "BANNED") {
    roleFilter = { banned: true };
  }

  // 1. Fetch user data (with order history)
  const [
    users,
    allCount,
    customersCount,
    staffCount,
    bannedCount,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        AND: [
          searchFilter,
          roleFilter,
        ],
      },
      include: {
        orders: {
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { [sortField]: sortOrder },
    }),
    prisma.user.count({ where: searchFilter }),
    prisma.user.count({ where: { role: "USER", ...searchFilter } }),
    prisma.user.count({
      where: {
        role: { in: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"] },
        ...searchFilter,
      },
    }),
    prisma.user.count({ where: { banned: true, ...searchFilter } }),
  ]);

  // 2. Stats calculation for header badges
  const activeCustomers = users.filter((u) => u.orders.length > 0).length;
  const newCustomersThisMonth = users.filter((u) => {
    const date = new Date(u.createdAt);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const counts = {
    ALL: allCount,
    CUSTOMERS: customersCount,
    STAFF: staffCount,
    BANNED: bannedCount,
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Customer Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              View customer profiles, orders history, and manage account access
            </p>
          </div>
        </div>

        {/* Right Side: Total Customers, Active Buyers, New Joiners Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total Users:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {allCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Active Buyers:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {activeCustomers}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/60 rounded-xl shadow-2xs text-xs font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              New (This Month):
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              +{newCustomersThisMonth}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <CustomerRoleFilter counts={counts} />

        <div className="relative min-w-[220px] sm:w-72">
          <AdminSearch placeholder="Search name, email, or phone..." />
        </div>
      </div>

      {/* 3. Actionable Customers Table (Full Width) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs overflow-hidden w-full">
        <CustomersTable customers={users} />
      </div>
    </div>
  );
}
