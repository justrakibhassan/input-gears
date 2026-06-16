import { Footer } from "@/components/layout/footer";
import Navbar, { NavbarSkeleton } from "@/components/layout/navbar";
import TopAnnouncement from "@/components/layout/top-announcement";
import { getStoreAppearance } from "@/modules/admin/actions";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeReset } from "@/components/theme-reset";
import { prisma } from "@/lib/prisma";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = await getStoreAppearance();

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
      <TopAnnouncement data={settings} />
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar initialCategories={categoriesWithBrands} />
      </Suspense>
      <div className="pb-24 lg:pb-0">
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
          {children}
        </Suspense>
        <Footer />
      </div>
    </NuqsAdapter>
  );
}
