import { Footer } from "@/components/layout/footer";
import Navbar, { NavbarSkeleton } from "@/components/layout/navbar";
import TopAnnouncement from "@/components/layout/top-announcement";
import AdminFloatingBar from "@/components/layout/admin-floating-bar";
import { getStoreAppearance } from "@/modules/admin/actions";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeReset } from "@/components/theme-reset";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = await getStoreAppearance();

  if (settings?.maintenanceMode) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const isAdmin =
      session?.user?.role &&
      ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(session.user.role as string);

    if (!isAdmin) {
      redirect("/maintenance");
    }
  }

  const categories = await prisma.category.findMany({
    include: {
      products: {
        select: {
          brand: true,
        },
        distinct: ["brand"],
        where: {
          brand: { not: null },
          isActive: true,
        },
      },
    },
  });

  const categoriesWithBrands = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    brands: Array.from(
      new Set(cat.products.map((p) => p.brand).filter((b): b is string => typeof b === "string")),
    ),
  }));

  return (
    <NuqsAdapter>
      <ThemeReset />
      <AdminFloatingBar />
      <TopAnnouncement data={settings} />
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar initialCategories={categoriesWithBrands} />
      </Suspense>
      <div className="pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
          {children}
        </Suspense>
        <Footer />
      </div>
    </NuqsAdapter>
  );
}
