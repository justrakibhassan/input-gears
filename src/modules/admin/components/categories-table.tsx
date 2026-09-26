"use client";

import React, { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Layers,
  Loader2,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { deleteCategory } from "@/modules/admin/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/alert-modal";
import CategoryModal from "./category-modal";

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
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Local filter & search state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "WITH_PRODUCTS" | "EMPTY">("ALL");

  const totalCount = categories.length;
  const withProductsCount = categories.filter((c) => c._count.products > 0).length;
  const emptyCount = categories.filter((c) => c._count.products === 0).length;

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Filter pill
      if (filterType === "WITH_PRODUCTS" && cat._count.products === 0) return false;
      if (filterType === "EMPTY" && cat._count.products > 0) return false;

      // 2. Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          (cat.description ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [categories, filterType, search]);

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(`/${slug}`);
    setCopiedSlug(slug);
    toast.success(`Copied "/${slug}" to clipboard`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

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

  const TABS = [
    { label: "All Categories", value: "ALL" as const, count: totalCount },
    { label: "With Products", value: "WITH_PRODUCTS" as const, count: withProductsCount },
    { label: "Empty", value: "EMPTY" as const, count: emptyCount },
  ];

  return (
    <div className="space-y-6 w-full">
      <AlertModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone and will unassign all linked products."
      />

      {/* 1. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = filterType === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterType(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isActive
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search category, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. Actionable Categories Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-16">Icon</th>
                <th className="px-5 py-3.5">Category Name & Details</th>
                <th className="px-5 py-3.5">Slug (URL)</th>
                <th className="px-5 py-3.5">Linked Products</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Layers size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No categories found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try searching with another keyword or create a new category.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* Thumbnail Icon */}
                    <td className="px-5 py-3.5">
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-700 relative bg-gray-50 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Layers size={18} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm block truncate">
                          {category.name}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate max-w-xs block mt-0.5">
                          {category.description || "No description provided"}
                        </span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => copySlug(category.slug)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono text-xs border border-gray-200/80 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer"
                        title="Click to copy slug"
                      >
                        <span>/{category.slug}</span>
                        {copiedSlug === category.slug ? (
                          <Check size={11} className="text-emerald-500" />
                        ) : (
                          <Copy size={11} className="text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Product Count Badge */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold",
                            category._count.products > 0
                              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200/60 dark:border-gray-700"
                          )}
                        >
                          {category._count.products}
                        </span>
                        <span className="text-gray-400 text-xs font-medium">products</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CategoryModal 
                          category={category} 
                          onSuccess={() => router.refresh()} 
                        />
                        <button
                          onClick={() => setDeletingId(category.id)}
                          disabled={isPending && deletingId === category.id}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Category"
                        >
                          {isPending && deletingId === category.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
