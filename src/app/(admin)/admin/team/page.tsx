import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TeamTable from "@/modules/admin/components/team-table";

export const metadata = {
  title: "Team Management — Admin",
};

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

  return (
    <div className="w-full space-y-6 pb-10">
      <TeamTable staff={staff} />
    </div>
  );
}
