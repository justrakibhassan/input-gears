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
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
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
            className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 shadow-xs flex items-center gap-4 group hover:shadow-md dark:shadow-none transition-all duration-300"
          >
            <div
              className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-950/20 dark:text-${stat.color}-400 rounded-xl group-hover:scale-105 transition-transform duration-300`}
            >
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">
                {stat.label}
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>


      {/* Customer Management Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
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
