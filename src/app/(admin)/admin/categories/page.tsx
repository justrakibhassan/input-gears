import { prisma } from "@/lib/prisma";
import { Layers, Package } from "lucide-react";
import CategoryModal from "@/modules/admin/components/category-modal";
import CategoriesTable from "@/modules/admin/components/categories-table";

export const metadata = {
  title: "Categories — Admin",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 1. Fetch stats data (all categories)
  const allCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // 2. Fetch filtered categories for table
  const categories = await prisma.category.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // Stats Calculation
  const totalCategories = allCategories.length;
  const totalProductsLinked = allCategories.reduce(
    (acc, cat) => acc + cat._count.products,
    0
  );

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Page Header with Title on Left & Summary Badges on Right (with icons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Category Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Organize product catalog, sub-collections, and SEO slugs
            </p>
          </div>
        </div>

        {/* Right Side: Total Categories, Products Linked Badges & Add Category Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Layers size={14} className="text-gray-400" />
            <span className="text-gray-400 font-medium">Categories:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {totalCategories}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Package size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Linked Products:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {totalProductsLinked}
            </span>
          </div>

          <CategoryModal triggerText="Add Category" />
        </div>
      </div>

      {/* 2. Main Content Wrapper */}
      <CategoriesTable categories={categories} />
    </div>
  );
}
