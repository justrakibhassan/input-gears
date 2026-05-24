import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayoutWrapper, { AdminHeaderSkeleton } from "@/modules/admin/components/admin-layout-wrapper";
import { Suspense } from "react";
import { User } from "@prisma/client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ✅ Security Check
  const allowedRoles = ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"];
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || !allowedRoles.includes(userRole || "")) {
    redirect("/");
  }

  return (
    <NuqsAdapter>
      <Suspense fallback={<AdminHeaderSkeleton />}>
        <AdminLayoutWrapper user={session.user as User}>
          {children}
        </AdminLayoutWrapper>
      </Suspense>
    </NuqsAdapter>
  );
}
