"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Layers, Loader2 } from "lucide-react";
import { deleteCategory } from "@/modules/admin/actions";
import { toast } from "sonner";
import { AlertModal } from "@/components/ui/alert-modal";
import CategoryModal from "./category-modal";
import AdminSearch from "./admin-search";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  _count: {
    products: number;
  };
}

interface CategoriesTableProps {
  categories: CategoryWithCount[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (!deletingId) return;

    startTransition(async () => {
      try {
        const res = await deleteCategory(deletingId);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to delete category");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
      <AlertModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
      />

      {/* Toolbar */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-full md:max-w-md">
          <AdminSearch placeholder="Search categories..." />
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
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
                      <CategoryModal 
                        category={category} 
                        onSuccess={() => router.refresh()} 
                      />
                      <button
                        onClick={() => setDeletingId(category.id)}
                        disabled={isPending && deletingId === category.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {isPending && deletingId === category.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
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
          <CategoryModal onSuccess={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}
