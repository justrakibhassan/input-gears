"use client";

import { useState, useTransition, useMemo, useEffect, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  Percent,
  Calendar,
  Package,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  ExternalLink,
  Flame,
} from "lucide-react";
import { updateProductSale, bulkUpdateSale } from "@/modules/admin/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  brand: string | null;
  isOnSale: boolean;
  salePrice: number | null;
  saleEndDate: Date | null;
  category: { name: string } | null;
}

interface SaleManagerProps {
  products: SaleProduct[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function discountPercent(original: number, sale: number) {
  return Math.round(((original - sale) / original) * 100);
}

interface EditState {
  salePrice: string;
  saleEndDate: string;
}

export default function SaleManager({ products: initialProducts }: SaleManagerProps) {
  const [products, setProducts] = useState<SaleProduct[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterOnSale, setFilterOnSale] = useState<"all" | "on" | "off">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [bulkSalePrice, setBulkSalePrice] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Stats
  const onSaleCount = products.filter((p) => p.isOnSale).length;
  const totalSavings = products
    .filter((p) => p.isOnSale && p.salePrice)
    .reduce((acc, p) => acc + (p.price - (p.salePrice ?? p.price)), 0);
  const expiringSoon = products.filter((p) => {
    if (!p.saleEndDate || now === 0) return false;
    const diff = new Date(p.saleEndDate).getTime() - now;
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 3; // within 3 days
  }).length;

  // Filter
  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q)
      );
    }
    if (filterOnSale === "on") list = list.filter((p) => p.isOnSale);
    if (filterOnSale === "off") list = list.filter((p) => !p.isOnSale);
    return list;
  }, [products, search, filterOnSale]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((p) => p.id)));
  }

  function getEdit(id: string, product: SaleProduct): EditState {
    return editStates[id] ?? {
      salePrice: product.salePrice?.toString() ?? "",
      saleEndDate: product.saleEndDate ? new Date(product.saleEndDate).toISOString().split("T")[0] : "",
    };
  }

  function setEdit(id: string, partial: Partial<EditState>) {
    setEditStates((prev) => ({
      ...prev,
      [id]: { ...getEdit(id, products.find((p) => p.id === id)!), ...partial },
    }));
  }

  async function handleToggle(product: SaleProduct, turnOn: boolean) {
    setLoadingIds((prev) => new Set(prev).add(product.id));
    const edit = getEdit(product.id, product);
    startTransition(async () => {
      const res = await updateProductSale(product.id, {
        isOnSale: turnOn,
        salePrice: turnOn && edit.salePrice ? parseFloat(edit.salePrice) : null,
        saleEndDate: turnOn && edit.saleEndDate ? edit.saleEndDate : null,
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  isOnSale: turnOn,
                  salePrice: turnOn && edit.salePrice ? parseFloat(edit.salePrice) : null,
                  saleEndDate: turnOn && edit.saleEndDate ? new Date(edit.saleEndDate) : null,
                }
              : p
          )
        );
        toast.success(turnOn ? `"${product.name}" is now on sale!` : `"${product.name}" removed from sale`);
        if (!turnOn) setExpandedRow(null);
      } else {
        toast.error(res.message ?? "Something went wrong");
      }
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(product.id);
        return s;
      });
    });
  }

  async function handleSave(product: SaleProduct) {
    const edit = getEdit(product.id, product);
    setLoadingIds((prev) => new Set(prev).add(product.id));
    startTransition(async () => {
      const res = await updateProductSale(product.id, {
        isOnSale: true,
        salePrice: edit.salePrice ? parseFloat(edit.salePrice) : null,
        saleEndDate: edit.saleEndDate || null,
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  isOnSale: true,
                  salePrice: edit.salePrice ? parseFloat(edit.salePrice) : null,
                  saleEndDate: edit.saleEndDate ? new Date(edit.saleEndDate) : null,
                }
              : p
          )
        );
        toast.success("Sale details updated");
        setExpandedRow(null);
      } else {
        toast.error(res.message ?? "Failed to save");
      }
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(product.id);
        return s;
      });
    });
  }

  async function handleBulkSale(turnOn: boolean) {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      const res = await bulkUpdateSale(Array.from(selectedIds), {
        isOnSale: turnOn,
        salePrice: turnOn && bulkSalePrice ? parseFloat(bulkSalePrice) : null,
        saleEndDate: turnOn && bulkEndDate ? bulkEndDate : null,
      });
      if (res.success) {
        const ids = Array.from(selectedIds);
        setProducts((prev) =>
          prev.map((p) =>
            ids.includes(p.id)
              ? {
                  ...p,
                  isOnSale: turnOn,
                  salePrice: turnOn && bulkSalePrice ? parseFloat(bulkSalePrice) : null,
                  saleEndDate: turnOn && bulkEndDate ? new Date(bulkEndDate) : null,
                }
              : p
          )
        );
        toast.success(`${ids.length} products ${turnOn ? "added to" : "removed from"} sale`);
        setSelectedIds(new Set());
        setBulkSalePrice("");
        setBulkEndDate("");
      } else {
        toast.error(res.message ?? "Bulk update failed");
      }
    });
  }

  const TABS = [
    { key: "all" as const, label: "All Products", count: products.length },
    { key: "on" as const, label: "On Sale", count: onSaleCount },
    { key: "off" as const, label: "Not on Sale", count: products.length - onSaleCount },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Tag size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Sale Manager
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Set promotional discounts, flash deals, and campaign expiry dates
            </p>
          </div>
        </div>

        {/* Right Side: On Sale, Total Savings, Expiring Badges & View Page Link */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 rounded-xl shadow-2xs text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <span className="text-rose-600 dark:text-rose-400 font-medium">On Sale:</span>
            <span className="font-extrabold text-rose-700 dark:text-rose-300">
              {onSaleCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Total Savings:</span>
            <span className="font-black text-emerald-700 dark:text-emerald-300">
              {formatPrice(totalSavings)}
            </span>
          </div>

          {expiringSoon > 0 && (
            <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-medium">Expiring Soon:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {expiringSoon}
              </span>
            </div>
          )}

          <Link
            href="/sale"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs active:scale-95"
          >
            <Flame size={14} className="text-rose-500" />
            <span>View Live Sale</span>
            <ExternalLink size={11} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Bulk Action Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-gray-900 text-white rounded-xl px-5 py-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-indigo-600 px-2 py-0.5 rounded-md text-[11px]">
              {selectedIds.size}
            </span>
            <span>Products Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="number"
              placeholder="Sale price ($)"
              value={bulkSalePrice}
              onChange={(e) => setBulkSalePrice(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs w-36 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
            />
            <input
              type="date"
              value={bulkEndDate}
              onChange={(e) => setBulkEndDate(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/40"
            />
            <button
              onClick={() => handleBulkSale(true)}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Add to Sale
            </button>
            <button
              onClick={() => handleBulkSale(false)}
              disabled={isPending}
              className="bg-white/10 hover:bg-white/20 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Remove
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = filterOnSale === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterOnSale(tab.key)}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, brand..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Actionable Sale Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Category</th>
                <th className="px-4 py-3.5">Regular Price</th>
                <th className="px-4 py-3.5">Sale Price</th>
                <th className="px-4 py-3.5 hidden lg:table-cell">Sale Ends</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="w-10 px-4 py-3.5 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Package size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No products found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try searching with a different keyword or filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isLoading = loadingIds.has(product.id);
                  const isExpanded = expandedRow === product.id;
                  const edit = getEdit(product.id, product);
                  const discount =
                    product.salePrice ? discountPercent(product.price, product.salePrice) : null;
                  const isExpired =
                    product.saleEndDate &&
                    now > 0 &&
                    new Date(product.saleEndDate).getTime() < now;

                  return (
                    <Fragment key={product.id}>
                      <tr
                        className={cn(
                          "transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50",
                          product.isOnSale && "bg-rose-50/20 dark:bg-rose-950/10",
                          isExpanded && "bg-indigo-50/30 dark:bg-indigo-950/20"
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <Package size={18} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                                {product.name}
                              </p>
                              {product.brand && (
                                <p className="text-[11px] text-gray-400 font-medium">
                                  {product.brand}
                                </p>
                              )}
                            </div>
                            {product.isOnSale && (
                              <span className="ml-1 shrink-0 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                SALE
                              </span>
                            )}
                            {isExpired && (
                              <span className="shrink-0 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <AlertCircle size={10} /> Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs font-medium">
                          {product.category?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3.5 text-xs sm:text-sm">
                          {product.salePrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-rose-600 dark:text-rose-400">
                                {formatPrice(product.salePrice)}
                              </span>
                              {discount && (
                                <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full">
                                  -{discount}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs italic">
                              Not set
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                          {product.saleEndDate ? (
                            <span
                              className={
                                isExpired
                                  ? "text-rose-500 font-bold"
                                  : "text-amber-600 dark:text-amber-400 font-semibold"
                              }
                            >
                              {new Date(product.saleEndDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 italic">
                              No expiry
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggle(product, !product.isOnSale)}
                            disabled={isLoading}
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50",
                              product.isOnSale ? "bg-rose-500" : "bg-gray-200 dark:bg-gray-700"
                            )}
                          >
                            {isLoading ? (
                              <Loader2 size={10} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                            ) : (
                              <span
                                className={cn(
                                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform",
                                  product.isOnSale ? "translate-x-4.5" : "translate-x-1"
                                )}
                              />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : product.id)}
                            className={cn(
                              "p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors cursor-pointer",
                              isExpanded && "rotate-180 text-indigo-600 bg-indigo-50 dark:bg-gray-800"
                            )}
                            title="Edit Sale Settings"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Edit Form Drawer */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 dark:bg-gray-800/40">
                          <td colSpan={8} className="px-6 py-4 border-t border-gray-200/60 dark:border-gray-700">
                            <div className="flex flex-wrap items-end gap-3.5">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Sale Price ($)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={edit.salePrice}
                                    onChange={(e) => setEdit(product.id, { salePrice: e.target.value })}
                                    placeholder={product.price.toFixed(2)}
                                    className="pl-6 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg text-xs w-32 focus:outline-none focus:border-rose-500"
                                  />
                                </div>
                                {edit.salePrice && parseFloat(edit.salePrice) < product.price && (
                                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                                    <Percent size={10} /> {discountPercent(product.price, parseFloat(edit.salePrice))}% discount
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Sale End Date
                                </label>
                                <div className="relative">
                                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="date"
                                    value={edit.saleEndDate}
                                    onChange={(e) => setEdit(product.id, { saleEndDate: e.target.value })}
                                    className="pl-7 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSave(product)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  <span>Save Changes</span>
                                </button>
                                <button
                                  onClick={() => setExpandedRow(null)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>

                              {!product.isOnSale && (
                                <p className="text-xs text-gray-400 italic flex items-center gap-1 mb-1">
                                  <AlertCircle size={11} /> Toggle the switch to make active immediately
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
