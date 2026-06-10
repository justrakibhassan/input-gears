import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  Search,
  Edit,
  Trash2,
  Layers,
  Package,
} from "lucide-react";
import CategoryModal from "@/modules/admin/components/category-modal";

export default async function CategoriesPage() {
  // 1. Fetch data (with product count)
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true }, // Count products
      },
    },
  });

  // Stats Calculation
  const totalCategories = categories.length;
  const totalProductsLinked = categories.reduce(
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
            <Layers size={24} />
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50/50">
          <div className="relative max-w-sm w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 w-16">Icon</th>
                  <th className="px-6 py-4">Category Name & Description</th>
                  <th className="px-6 py-4">Slug (URL)</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:bg-gray-800/50/80 transition-colors group"
                  >
                    {/* Icon / Image */}
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative bg-white dark:bg-gray-900 shadow-sm dark:shadow-none">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          // Fallback if no image (Colorful Initials)
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-50 to-blue-50 text-indigo-600 font-bold text-lg">
                            {category.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Desc */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white block">
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-400 truncate max-w-[250px] block">
                        {category.description || "No description provided"}
                      </span>
                    </td>

                    {/* Slug Badge */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-xs border border-gray-200 dark:border-gray-700">
                        /{category.slug}
                      </div>
                    </td>

                    {/* Product Count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold 
                             ${
                               category._count.products > 0
                                 ? "bg-indigo-50 text-indigo-600"
                                 : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                             }`}
                        >
                          {category._count.products}
                        </span>
                        <span className="text-gray-400 text-xs">items</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/categories/edit/${category.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
              <Layers size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No categories found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2 mb-6">
              Create categories to organize your products efficiently.
            </p>
            <CategoryModal />
          </div>
        )}
      </div>
    </div>
  );
}
