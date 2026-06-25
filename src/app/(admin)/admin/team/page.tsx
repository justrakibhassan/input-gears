import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Users, Shield, UserCheck, Edit3 } from "lucide-react";
import TeamTable from "@/modules/admin/components/team-table";

export default async function TeamPage() {
  // 1. Security check: Only SUPER_ADMIN allowed
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;
  if (!session?.user || userRole !== "SUPER_ADMIN") {
    redirect("/");
  }

  // 2. Fetch staff members
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. Stats calculation
  const totalStaff = staff.length;
  const admins = staff.filter((s) => s.role === "SUPER_ADMIN").length;
  const managers = staff.filter((s) => s.role === "MANAGER").length;
  const editors = staff.filter((s) => s.role === "CONTENT_EDITOR").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Staff",
            value: totalStaff,
            icon: Users,
            color: "indigo",
          },
          {
            label: "Admins",
            value: admins,
            icon: Shield,
            color: "rose",
          },
          {
            label: "Managers",
            value: managers,
            icon: UserCheck,
            color: "amber",
          },
          {
            label: "Editors",
            value: editors,
            icon: Edit3,
            color: "blue",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 shadow-xs flex items-center gap-4 group hover:shadow-md dark:shadow-none transition-all duration-300"
          >
            <div
              className={`p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-300 ${
                stat.color === "indigo"
                  ? "bg-indigo-50 text-indigo-655 dark:bg-indigo-950/20 dark:text-indigo-400"
                  : stat.color === "rose"
                  ? "bg-rose-50 text-rose-655 dark:bg-rose-950/20 dark:text-rose-400"
                  : stat.color === "amber"
                  ? "bg-amber-50 text-amber-655 dark:bg-amber-950/20 dark:text-amber-400"
                  : "bg-blue-50 text-blue-655 dark:bg-blue-950/20 dark:text-blue-400"
              }`}
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

      {/* Team Management Table */}
      <TeamTable staff={staff} />
    </div>
  );
}
