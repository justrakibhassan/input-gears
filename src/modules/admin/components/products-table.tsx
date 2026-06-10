"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Box,
  X,
  Loader2,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteProducts } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";

import { Product } from "@/types/product";

interface ProductsTableProps {
  products: Product[];
  categories: { id: string; name: string; slug: string }[];
  totalCount: number; // Filtered Count
  allCount: number; // Total Count in Store
}

import { AlertModal } from "@/components/ui/alert-modal";
import ProductEditModal from "./product-edit-modal";
import BulkStockUpdateModal from "./bulk-stock-update-modal";

export default function ProductsTable({
  products,
  categories,
  totalCount,
  allCount,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected =
    products.length > 0 && selectedIds.length === products.length;

  // Sorting logic
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === field) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("order", "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    if (currentSort !== field)
      return <ArrowUpDown size={14} className="opacity-30" />;
    return currentOrder === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  // Filter States (using nuqs for better URL sync)
  const [categoryFilter, setCategoryFilter] = useQueryState("category", {
    shallow: false,
  });
  const [stockFilter, setStockFilter] = useQueryState("stock", {
    shallow: false,
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const res = await deleteProducts(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="relative">
      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
        title="Delete Selected Products?"
        description={`This action is permanent and cannot be undone. You are about to delete ${selectedIds.length} products.`}
      />

      <ProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
          router.refresh();
        }}
        product={selectedProduct}
      />

      {isStockModalOpen && (
        <BulkStockUpdateModal
          key={selectedIds.join(",")}
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          selectedProducts={products.filter((p) => selectedIds.includes(p.id))}
          onSuccess={() => {
            setSelectedIds([]);
            router.refresh();
          }}
        />
      )}
      {/* 1. Enhanced Toolbar (Filtering) */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-800/50/20">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Filters
          </span>
        </div>

        {/* Stock History Link */}
        <Link
          href="/admin/inventory/history"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-200 hover:shadow-sm dark:shadow-none transition-all group"
        >
          <History
            size={14}
            className="text-gray-400 group-hover:text-indigo-600 transition-colors"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">
            Stock History
          </span>
        </Link>

        {/* Category Filter */}
        <select
          value={categoryFilter || ""}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter || ""}
          onChange={(e) => setStockFilter(e.target.value || null)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
        >
          <option value="">Stock Status</option>
          <option value="in-stock">In Stock (&gt;10)</option>
          <option value="low-stock">Low Stock (1-10)</option>
          <option value="out-of-stock">Out of Stock (0)</option>
        </select>

        {/* Reset Filters */}
        {(categoryFilter || stockFilter) && (
          <button
            onClick={() => {
              setCategoryFilter(null);
              setStockFilter(null);
            }}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 2. Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10"
          >
            <div className="flex items-center gap-2 pr-6 border-r border-white/10 text-sm font-black uppercase tracking-widest">
              <span className="bg-indigo-600 w-6 h-6 flex items-center justify-center rounded-full text-[10px]">
                {selectedIds.length}
              </span>
              Selected
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isPending}
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 p-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} className="text-red-400" />
                )}
                Delete
              </button>

              <button
                disabled={isPending}
                onClick={() => setIsStockModalOpen(true)}
                className="flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-400 p-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                <Layers size={16} className="text-indigo-400" />
                Update Stock
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-2 hover:bg-white dark:hover:bg-gray-900/10 p-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. The Table */}
      {products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 w-12">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 w-16 font-black uppercase tracking-widest text-[10px]">
                  Image
                </th>
                <th
                  className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Product Name {getSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center gap-2">
                    Price {getSortIcon("price")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center gap-2">
                    Inventory {getSortIcon("stock")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-2">
                    Updated {getSortIcon("updatedAt")}
                  </div>
                </th>
                <th className="px-6 py-4 text-right font-black uppercase tracking-widest text-[10px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 font-medium">
              {products.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                // Stock Status Logic
                let stockStatus = {
                  label: "In Stock",
                  color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
                };
                if (product.stock === 0)
                  stockStatus = {
                    label: "Out of Stock",
                    color: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20",
                  };
                else if (product.stock <= 10)
                  stockStatus = {
                    label: "Low Stock",
                    color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
                  };

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "hover:bg-indigo-50/10 transition-colors group",
                      isSelected && "bg-indigo-50/20"
                    )}
                  >
                    {/* Selection */}
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                      />
                    </td>

                    {/* Image */}
                    <td className="px-6 py-5">
                      <div className="h-12 w-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden relative group-hover:scale-105 transition-transform">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Box size={20} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors uppercase tracking-tight"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {product.category?.name || "No Category"}
                          </span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-[10px] font-bold text-indigo-400">
                            {product.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.isActive ? (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">
                              <RefreshCw size={10} className="animate-spin-slow" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                              Disabled
                            </span>
                          )}

                          {product.scheduledAt && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/50">
                              <Calendar size={10} /> {new Date(product.scheduledAt).toLocaleDateString("en-US")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-5">
                      <span className="font-black text-gray-900 dark:text-white text-base">
                        ${product.price.toFixed(2)}
                      </span>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 overflow-hidden">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border max-w-fit",
                            stockStatus.color
                          )}
                        >
                          {stockStatus.label}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {product.stock} Units left
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(product.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
                          title="View Live"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-24 w-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800">
            <Box size={40} className="text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            No products found
          </h3>
          <p className="text-gray-400 max-w-sm mx-auto mt-2 mb-8 font-medium text-sm">
            Try adjusting your filters or search terms to find what you&apos;re
            looking for.
          </p>
          {(categoryFilter || stockFilter || searchParams.get("q")) && (
            <button
              onClick={() => {
                setCategoryFilter(null);
                setStockFilter(null);
                router.push(pathname);
              }}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg dark:shadow-none active:scale-95"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* 4. Pagination Footer */}
      {totalCount > 0 && (
        <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Box size={14} className="text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900 dark:text-white">{products.length}</span>{" "}
              of <span className="text-gray-900 dark:text-white">{totalCount}</span>{" "}
              {totalCount !== allCount ? "Filtered" : ""} Products
            </p>
          </div>
          <div className="flex gap-3">
            <button
              disabled={parseInt(searchParams.get("page") || "1") <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                const currentPage = parseInt(params.get("page") || "1");
                params.set("page", (currentPage - 1).toString());
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm dark:shadow-none active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:hover:bg-gray-900 disabled:hover:text-gray-300 disabled:hover:border-gray-100 dark:border-gray-800"
            >
              Prev
            </button>
            <button
              disabled={
                products.length < parseInt(searchParams.get("limit") || "20") &&
                totalCount <=
                  parseInt(searchParams.get("page") || "1") *
                    parseInt(searchParams.get("limit") || "20")
              }
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                const currentPage = parseInt(params.get("page") || "1");
                params.set("page", (currentPage + 1).toString());
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm dark:shadow-none active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:hover:bg-gray-900 disabled:hover:text-gray-300 disabled:hover:border-gray-100 dark:border-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
