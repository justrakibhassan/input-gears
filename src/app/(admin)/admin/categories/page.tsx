import { prisma } from "@/lib/prisma";
import {
  Layers,
  Package,
} from "lucide-react";
import CategoryModal from "@/modules/admin/components/category-modal";
import CategoriesTable from "@/modules/admin/components/categories-table";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize your products into catalog groups.
          </p>
        </div>
        <CategoryModal />
      </div>

      {/* 2. Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Categories */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-indigo-200 transition-colors">
          <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform">
            <Layers size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Categories
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalCategories}
            </h3>
          </div>
        </div>

        {/* Products Linked */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-emerald-200 transition-colors">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Products Linked
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalProductsLinked}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Main Content Wrapper */}
      <CategoriesTable categories={categories} />
    </div>
  );
}
