"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  Layers,
  PauseCircle,
  FileEdit,
  CheckCircle2,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteProducts, updateProductStatus } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";

import { Product } from "@/types/product";
import { AlertModal } from "@/components/ui/alert-modal";
import ProductEditModal from "./product-edit-modal";
import BulkStockUpdateModal from "./bulk-stock-update-modal";
import AdminSearch from "./admin-search";

interface ProductsTableProps {
  products: Product[];
  categories: { id: string; name: string; slug: string }[];
  totalCount: number; // Filtered Count
  allCount: number; // Total Count in Store
  stockCounts?: {
    all: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export default function ProductsTable({
  products,
  categories,
  totalCount,
  allCount,
  stockCounts,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClose = () => setOpenDropdownId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

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
      return <ArrowUpDown size={13} className="opacity-30" />;
    return currentOrder === "asc" ? (
      <ArrowUp size={13} />
    ) : (
      <ArrowDown size={13} />
    );
  };

  // Filter States
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

  // Bulk/Single Actions
  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const idsToDelete = productToDelete ? [productToDelete] : selectedIds;
      const res = await deleteProducts(idsToDelete);
      if (res.success) {
        toast.success(res.message);
        if (productToDelete) {
          setProductToDelete(null);
        } else {
          setSelectedIds([]);
        }
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const STOCK_TABS = [
    { label: "All", value: null, count: stockCounts?.all ?? allCount },
    { label: "In Stock", value: "in-stock", count: stockCounts?.inStock ?? 0 },
    { label: "Low Stock", value: "low-stock", count: stockCounts?.lowStock ?? 0 },
    { label: "Out of Stock", value: "out-of-stock", count: stockCounts?.outOfStock ?? 0 },
  ];

  return (
    <div className="space-y-6 w-full relative">
      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
        title={productToDelete ? "Delete Product?" : "Delete Selected Products?"}
        description={
          productToDelete
            ? "This action is permanent and cannot be undone. You are about to delete this product."
            : `This action is permanent and cannot be undone. You are about to delete ${selectedIds.length} products.`
        }
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

      {/* 1. Control Bar: Stock Filter Pills, Category Dropdown & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STOCK_TABS.map((tab) => {
              const isActive = stockFilter === tab.value || (!stockFilter && tab.value === null);
              return (
                <button
                  key={tab.label}
                  onClick={() => setStockFilter(tab.value)}
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
            <AdminSearch placeholder="Search name, slug, SKU..." />
          </div>
        </div>

        {/* Bottom Sub-toolbar: Category Dropdown & Clear Filters */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium text-[11px]">Category:</span>
            <select
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-xs font-bold rounded-lg px-2.5 py-1 text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {(categoryFilter || stockFilter || searchParams.get("q")) && (
              <button
                onClick={() => {
                  setCategoryFilter(null);
                  setStockFilter(null);
                  router.push(pathname);
                }}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline ml-2"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="text-gray-400 text-xs">
            Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> products
          </div>
        </div>
      </div>

      {/* 2. Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-white/10 text-xs font-bold">
              <span className="bg-indigo-600 px-2 py-0.5 rounded-md text-[11px]">
                {selectedIds.length}
              </span>
              Selected
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isPending}
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>Delete</span>
              </button>

              <button
                disabled={isPending}
                onClick={() => setIsStockModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <Layers size={13} />
                <span>Update Stock</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Cancel selection"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Actionable Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5 w-14">Image</th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product Details</span>
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Price</span>
                      {getSortIcon("price")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort("stock")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Inventory</span>
                      {getSortIcon("stock")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors hidden md:table-cell"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Updated</span>
                      {getSortIcon("updatedAt")}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {products.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  let stockStatus = {
                    label: "In Stock",
                    color: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60",
                  };
                  if (product.stock === 0)
                    stockStatus = {
                      label: "Out of Stock",
                      color: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/60",
                    };
                  else if (product.stock <= 10)
                    stockStatus = {
                      label: "Low Stock",
                      color: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60",
                    };

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors group",
                        isSelected && "bg-indigo-50/20"
                      )}
                    >
                      {/* Selection */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                        />
                      </td>

                      {/* Image */}
                      <td className="px-4 py-3.5">
                        <div className="h-10 w-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Box size={18} className="text-gray-400" />
                          )}
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 text-xs sm:text-sm line-clamp-1 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {product.category?.name || "No Category"}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] font-mono text-indigo-500">
                              /{product.slug}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200">
                                Disabled
                              </span>
                            )}
                            {product.isOnSale && (
                              <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100 uppercase">
                                Sale
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          ${product.price.toFixed(2)}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border max-w-fit",
                              stockStatus.color
                            )}
                          >
                            {stockStatus.label}
                          </span>
                          <span className="text-[11px] font-bold text-gray-400">
                            {product.stock} units
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                        {new Date(product.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="View Live"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </Link>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === product.id ? null : product.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                              title="Set Status"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {openDropdownId === product.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                              >
                                <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">Set Status</p>

                                {/* Active */}
                                <button
                                  disabled={isPending}
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    startTransition(async () => {
                                      const res = await updateProductStatus(product.id, "active");
                                      if (res.success) toast.success(res.message);
                                      else toast.error(res.message);
                                      router.refresh();
                                    });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left font-semibold transition-colors cursor-pointer",
                                    product.isActive
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  )}
                                >
                                  <CheckCircle2 size={13} className={product.isActive ? "text-emerald-500" : "text-gray-300"} />
                                  <span>Active</span>
                                </button>

                                {/* Paused */}
                                <button
                                  disabled={isPending}
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    startTransition(async () => {
                                      const res = await updateProductStatus(product.id, "paused");
                                      if (res.success) toast.success(res.message);
                                      else toast.error(res.message);
                                      router.refresh();
                                    });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left font-semibold transition-colors cursor-pointer",
                                    !product.isActive && !product.scheduledAt
                                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  )}
                                >
                                  <PauseCircle size={13} className={!product.isActive && !product.scheduledAt ? "text-amber-500" : "text-gray-300"} />
                                  <span>Paused</span>
                                </button>

                                {/* Draft */}
                                <button
                                  disabled={isPending}
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    startTransition(async () => {
                                      const res = await updateProductStatus(product.id, "draft");
                                      if (res.success) toast.success(res.message);
                                      else toast.error(res.message);
                                      router.refresh();
                                    });
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left font-semibold cursor-pointer"
                                >
                                  <FileEdit size={13} className="text-gray-300" />
                                  <span>Draft</span>
                                </button>

                                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                                {/* Delete */}
                                <button
                                  onClick={() => {
                                    setProductToDelete(product.id);
                                    setIsDeleteModalOpen(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left font-semibold cursor-pointer"
                                >
                                  <Trash2 size={13} className="text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={36} className="text-gray-300 dark:text-gray-600 mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              No products found
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
              Try adjusting your category, stock filters, or search terms.
            </p>
          </div>
        )}

        {/* 4. Pagination Footer */}
        {totalCount > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-400">
              Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> products
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={parseInt(searchParams.get("page") || "1") <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  const currentPage = parseInt(params.get("page") || "1");
                  params.set("page", (currentPage - 1).toString());
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
