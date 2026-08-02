"use client";

import { useState, useTransition, useMemo, useEffect, Fragment } from "react";
import Image from "next/image";
import { Search, X, Percent, Calendar, Package, ChevronDown, Check, Loader2, AlertCircle } from "lucide-react";
import { updateProductSale, bulkUpdateSale } from "@/modules/admin/actions";
import { toast } from "sonner";

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

// Inline edit row state
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
  // Stable timestamp to avoid "impure function during render"
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Stats
  const onSaleCount = products.filter(p => p.isOnSale).length;
  const totalSavings = products
    .filter(p => p.isOnSale && p.salePrice)
    .reduce((acc, p) => acc + (p.price - (p.salePrice ?? p.price)), 0);
  const expiringSoon = products.filter(p => {
    if (!p.saleEndDate || now === 0) return false;
    const diff = new Date(p.saleEndDate).getTime() - now;
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 3; // within 3 days
  }).length;

  // Filter
  const filtered = useMemo(() => {
    let list = products;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(search.toLowerCase()));
    if (filterOnSale === "on") list = list.filter(p => p.isOnSale);
    if (filterOnSale === "off") list = list.filter(p => !p.isOnSale);
    return list;
  }, [products, search, filterOnSale]);

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
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
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  }

  function getEdit(id: string, product: SaleProduct): EditState {
    return editStates[id] ?? {
      salePrice: product.salePrice?.toString() ?? "",
      saleEndDate: product.saleEndDate ? new Date(product.saleEndDate).toISOString().split("T")[0] : "",
    };
  }

  function setEdit(id: string, partial: Partial<EditState>) {
    setEditStates(prev => ({ ...prev, [id]: { ...getEdit(id, products.find(p => p.id === id)!), ...partial } }));
  }

  async function handleToggle(product: SaleProduct, turnOn: boolean) {
    setLoadingIds(prev => new Set(prev).add(product.id));
    const edit = getEdit(product.id, product);
    startTransition(async () => {
      const res = await updateProductSale(product.id, {
        isOnSale: turnOn,
        salePrice: turnOn && edit.salePrice ? parseFloat(edit.salePrice) : null,
        saleEndDate: turnOn && edit.saleEndDate ? edit.saleEndDate : null,
      });
      if (res.success) {
        setProducts(prev => prev.map(p =>
          p.id === product.id
            ? { ...p, isOnSale: turnOn, salePrice: turnOn && edit.salePrice ? parseFloat(edit.salePrice) : null, saleEndDate: turnOn && edit.saleEndDate ? new Date(edit.saleEndDate) : null }
            : p
        ));
        toast.success(turnOn ? `"${product.name}" is now on sale!` : `"${product.name}" removed from sale`);
        if (!turnOn) setExpandedRow(null);
      } else {
        toast.error(res.message ?? "Something went wrong");
      }
      setLoadingIds(prev => { const s = new Set(prev); s.delete(product.id); return s; });
    });
  }

  async function handleSave(product: SaleProduct) {
    const edit = getEdit(product.id, product);
    setLoadingIds(prev => new Set(prev).add(product.id));
    startTransition(async () => {
      const res = await updateProductSale(product.id, {
        isOnSale: true,
        salePrice: edit.salePrice ? parseFloat(edit.salePrice) : null,
        saleEndDate: edit.saleEndDate || null,
      });
      if (res.success) {
        setProducts(prev => prev.map(p =>
          p.id === product.id
            ? { ...p, salePrice: edit.salePrice ? parseFloat(edit.salePrice) : null, saleEndDate: edit.saleEndDate ? new Date(edit.saleEndDate) : null }
            : p
        ));
        toast.success("Sale details updated");
        setExpandedRow(null);
      } else toast.error(res.message ?? "Failed to save");
      setLoadingIds(prev => { const s = new Set(prev); s.delete(product.id); return s; });
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
        setProducts(prev => prev.map(p =>
          ids.includes(p.id)
            ? { ...p, isOnSale: turnOn, salePrice: turnOn && bulkSalePrice ? parseFloat(bulkSalePrice) : null, saleEndDate: turnOn && bulkEndDate ? new Date(bulkEndDate) : null }
            : p
        ));
        toast.success(`${ids.length} products ${turnOn ? "added to" : "removed from"} sale`);
        setSelectedIds(new Set());
        setBulkSalePrice("");
        setBulkEndDate("");
      } else toast.error(res.message ?? "Bulk update failed");
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-5">
          <p className="text-xs font-bold text-red-400 dark:text-red-300 uppercase tracking-widest mb-1">On Sale</p>
          <p className="text-3xl font-black text-red-600 dark:text-red-400">{onSaleCount}</p>
          <p className="text-xs text-red-400 dark:text-red-300/80 mt-1">of {products.length} products</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5">
          <p className="text-xs font-bold text-emerald-500 dark:text-emerald-300 uppercase tracking-widest mb-1">Total Savings</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalSavings)}</p>
          <p className="text-xs text-emerald-400 dark:text-emerald-300/80 mt-1">offered to customers</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-500 dark:text-amber-300 uppercase tracking-widest mb-1">Expiring Soon</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{expiringSoon}</p>
          <p className="text-xs text-amber-400 dark:text-amber-300/80 mt-1">within 3 days</p>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-900 dark:bg-gray-900 text-white border border-indigo-800 dark:border-gray-800 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
          <span className="font-bold text-sm">{selectedIds.size} selected</span>
          <input
            type="number"
            placeholder="Sale price (optional)"
            value={bulkSalePrice}
            onChange={e => setBulkSalePrice(e.target.value)}
            className="bg-white/10 dark:bg-gray-800 border border-white/20 dark:border-gray-700 text-white rounded-xl px-3 py-1.5 text-sm w-44 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="date"
            value={bulkEndDate}
            onChange={e => setBulkEndDate(e.target.value)}
            className="bg-white/10 dark:bg-gray-800 border border-white/20 dark:border-gray-700 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            onClick={() => handleBulkSale(true)}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-400 text-white font-bold text-sm px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
          >
            Add to Sale
          </button>
          <button
            onClick={() => handleBulkSale(false)}
            disabled={isPending}
            className="bg-white/10 dark:bg-gray-800 hover:bg-white/20 dark:hover:bg-gray-700 font-bold text-sm px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
          >
            Remove from Sale
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "on", "off"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterOnSale(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                filterOnSale === f
                  ? f === "on" ? "bg-red-500 text-white" : f === "off" ? "bg-gray-900 dark:bg-indigo-600 text-white" : "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "on" ? "On Sale" : "Not on Sale"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-100 dark:border-gray-800 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded accent-indigo-600 cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Price</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sale Price</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden lg:table-cell">Ends</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No products found</p>
                </td>
              </tr>
            )}
            {filtered.map(product => {
              const isLoading = loadingIds.has(product.id);
              const isExpanded = expandedRow === product.id;
              const edit = getEdit(product.id, product);
              const discount = product.salePrice ? discountPercent(product.price, product.salePrice) : null;
              const isExpired = product.saleEndDate && now > 0 && new Date(product.saleEndDate).getTime() < now;

              return (
                <Fragment key={product.id}>
                  <tr
                    className={`transition-colors ${
                      product.isOnSale
                        ? "bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/40"
                        : "bg-white dark:bg-gray-900 hover:bg-gray-50/60 dark:hover:bg-gray-800/60"
                    } ${isExpanded ? "border-b-0" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="rounded accent-indigo-600 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative">
                          {product.image
                            ? <Image src={product.image} alt={product.name} fill className="object-contain p-1" />
                            : <Package size={20} className="m-auto text-gray-300 dark:text-gray-600" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{product.brand}</p>}
                        </div>
                        {product.isOnSale && (
                          <span className="ml-1 shrink-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            SALE
                          </span>
                        )}
                        {isExpired && (
                          <span className="shrink-0 flex items-center gap-1 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            <AlertCircle size={10} /> Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs font-medium">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      {product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-red-600 dark:text-red-400">{formatPrice(product.salePrice)}</span>
                          {discount && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-full">-{discount}%</span>}
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs italic">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {product.saleEndDate
                        ? <span className={isExpired ? "text-red-400 font-bold" : "text-amber-600 dark:text-amber-400 font-semibold"}>{new Date(product.saleEndDate).toLocaleDateString()}</span>
                        : <span className="text-gray-300 dark:text-gray-600 italic">No expiry</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(product, !product.isOnSale)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          product.isOnSale ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                        } disabled:opacity-50`}
                      >
                        {isLoading
                          ? <Loader2 size={12} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                          : <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${product.isOnSale ? "translate-x-6" : "translate-x-1"}`} />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : product.id)}
                        className={`p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors ${
                          isExpanded ? "rotate-180 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-800" : ""
                        }`}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded edit row */}
                  {isExpanded && (
                    <tr className={product.isOnSale ? "bg-red-50/20 dark:bg-red-950/30" : "bg-gray-50/50 dark:bg-gray-800/40"}>
                      <td colSpan={8} className="px-6 py-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                        <div className="flex flex-wrap items-end gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Sale Price ($)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={edit.salePrice}
                                onChange={e => setEdit(product.id, { salePrice: e.target.value })}
                                placeholder={product.price.toFixed(2)}
                                className="pl-7 pr-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-sm w-36 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
                              />
                            </div>
                            {edit.salePrice && parseFloat(edit.salePrice) < product.price && (
                              <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                                <Percent size={10} /> {discountPercent(product.price, parseFloat(edit.salePrice))}% off
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Sale End Date</label>
                            <div className="relative">
                              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                              <input
                                type="date"
                                value={edit.saleEndDate}
                                onChange={e => setEdit(product.id, { saleEndDate: e.target.value })}
                                className="pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(product)}
                              disabled={isLoading}
                              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Save
                            </button>
                            <button
                              onClick={() => setExpandedRow(null)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          {!product.isOnSale && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1 mt-1">
                              <AlertCircle size={12} /> Toggle the switch to activate the sale
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
