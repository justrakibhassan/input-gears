"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Send,
  Mail,
  Search,
  ChevronDown,
  Download,
  Package,
  Loader2,
  X,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";
import { sendCartRecoveryEmail } from "@/modules/admin/actions/abandoned-cart-actions";

export interface AbandonedCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface AbandonedCart {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  itemsCount: number;
  totalAmount: number;
  lastActive: Date | string;
  items: AbandonedCartItem[];
}

interface AbandonedCartsTableProps {
  data: AbandonedCart[];
}

// Fallback demo abandoned carts if DB is clean
const demoAbandonedCarts: AbandonedCart[] = [
  {
    userId: "demo_usr_01",
    userName: "Alex Morgan",
    userEmail: "alex.morgan@gmail.com",
    userPhone: "+1 (555) 381-9921",
    itemsCount: 2,
    totalAmount: 289.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 45), // 45m ago
    items: [
      {
        productId: "prod_1",
        productName: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
        price: 199.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60",
      },
      {
        productId: "prod_2",
        productName: "Gateron Oil King Linear Switches (110 Pcs)",
        price: 90.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
  {
    userId: "demo_usr_02",
    userName: "David Chen",
    userEmail: "d.chen@outlook.com",
    userPhone: "+1 (555) 749-1823",
    itemsCount: 1,
    totalAmount: 145.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3h ago
    items: [
      {
        productId: "prod_3",
        productName: "GMK Laser Custom Keycap Set (Cherry Profile)",
        price: 145.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
  {
    userId: "demo_usr_03",
    userName: "Emma Watson",
    userEmail: "emma.w@techmail.io",
    userPhone: null,
    itemsCount: 3,
    totalAmount: 412.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18h ago
    items: [
      {
        productId: "prod_4",
        productName: "Zoom75 Wireless Keyboard Kit (E-White)",
        price: 260.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60",
      },
      {
        productId: "prod_5",
        productName: "Durock V2 Screw-in Stabilizers (Smokey)",
        price: 32.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
      },
      {
        productId: "prod_6",
        productName: "Custom Coiled Aviator Cable (Laser Purple)",
        price: 120.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
  {
    userId: "demo_usr_04",
    userName: "Liam Bennett",
    userEmail: "liam.bennett@yahoo.com",
    userPhone: "+1 (555) 902-3341",
    itemsCount: 1,
    totalAmount: 79.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    items: [
      {
        productId: "prod_7",
        productName: "Akko 5075B Plus RGB Mechanical Keyboard",
        price: 79.0,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60",
      },
    ],
  },
];

export function AbandonedCartsTable({ data: initialData }: AbandonedCartsTableProps) {
  const carts = useMemo(() => {
    return initialData && initialData.length > 0 ? initialData : demoAbandonedCarts;
  }, [initialData]);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "HIGH_VALUE" | "RECENT" | "MULTI">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Recovery Email Modal State
  const [selectedRecoveryCart, setSelectedRecoveryCart] = useState<AbandonedCart | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState("COMEBACK10");
  const [discountValue, setDiscountValue] = useState(10);
  const [customMsg, setCustomMsg] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Stats calculation
  const totalCarts = carts.length;
  const totalRevenue = carts.reduce((acc, c) => acc + c.totalAmount, 0);
  const recent24h = carts.filter((c) => {
    const time = new Date(c.lastActive).getTime();
    return Date.now() - time <= 1000 * 60 * 60 * 24;
  }).length;
  const highValue = carts.filter((c) => c.totalAmount >= 100).length;
  const multiItems = carts.filter((c) => c.itemsCount > 1).length;

  // Filtering
  const filteredCarts = useMemo(() => {
    return carts.filter((cart) => {
      // 1. Tab filter
      if (filterTab === "HIGH_VALUE" && cart.totalAmount < 100) return false;
      if (filterTab === "RECENT") {
        const time = new Date(cart.lastActive).getTime();
        if (Date.now() - time > 1000 * 60 * 60 * 24) return false;
      }
      if (filterTab === "MULTI" && cart.itemsCount <= 1) return false;

      // 2. Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          cart.userName.toLowerCase().includes(q) ||
          cart.userEmail.toLowerCase().includes(q) ||
          (cart.userPhone ?? "").toLowerCase().includes(q) ||
          cart.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [carts, filterTab, search]);

  const totalPages = Math.ceil(filteredCarts.length / pageSize) || 1;
  const paginatedCarts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCarts.slice(start, start + pageSize);
  }, [filteredCarts, page, pageSize]);

  // Handle send recovery email
  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecoveryCart) return;

    setIsSending(true);
    try {
      const res = await sendCartRecoveryEmail({
        userId: selectedRecoveryCart.userId,
        userEmail: selectedRecoveryCart.userEmail,
        userName: selectedRecoveryCart.userName,
        couponCode: selectedCoupon,
        discountPercent: discountValue,
        customMessage: customMsg,
      });

      if (res.success) {
        toast.success(res.message);
        setSelectedRecoveryCart(null);
        setCustomMsg("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to send recovery email");
    } finally {
      setIsSending(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (filteredCarts.length === 0) {
      toast.error("No carts to export");
      return;
    }
    const headers = ["Customer Name", "Customer Email", "Phone", "Items Count", "Total Value", "Last Active", "Products"];
    const rows = filteredCarts.map((c) => [
      `"${c.userName}"`,
      `"${c.userEmail}"`,
      `"${c.userPhone || ""}"`,
      c.itemsCount,
      c.totalAmount,
      format(new Date(c.lastActive), "yyyy-MM-dd HH:mm:ss"),
      `"${c.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `abandoned_carts_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredCarts.length} abandoned carts to CSV`);
  };

  const TABS = [
    { label: "All Carts", value: "ALL" as const, count: totalCarts },
    { label: "High Value (>$100)", value: "HIGH_VALUE" as const, count: highValue },
    { label: "Recent 24h", value: "RECENT" as const, count: recent24h },
    { label: "Multiple Items", value: "MULTI" as const, count: multiItems },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Recovery Email Modal */}
      {selectedRecoveryCart && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 animate-in fade-in duration-200"
            onClick={() => setSelectedRecoveryCart(null)}
          />
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 z-101">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Send size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Send Cart Recovery Incentive
                  </h3>
                  <p className="text-xs text-gray-500">
                    To: {selectedRecoveryCart.userName} ({selectedRecoveryCart.userEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecoveryCart(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendRecovery} className="p-6 space-y-4 text-xs">
              {/* Summary box */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 font-medium">Cart Value:</span>
                  <p className="font-black text-gray-900 dark:text-white text-sm">
                    {formatPrice(selectedRecoveryCart.totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-medium">Items in Cart:</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {selectedRecoveryCart.itemsCount} product(s)
                  </p>
                </div>
              </div>

              {/* Offer / Coupon selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Select Recovery Coupon / Incentive
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "COMEBACK10", discount: 10, label: "10% OFF" },
                    { code: "GEARUP15", discount: 15, label: "15% OFF" },
                    { code: "SPECIAL20", discount: 20, label: "20% OFF" },
                  ].map((cpn) => (
                    <button
                      type="button"
                      key={cpn.code}
                      onClick={() => {
                        setSelectedCoupon(cpn.code);
                        setDiscountValue(cpn.discount);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer",
                        selectedCoupon === cpn.code
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 shadow-2xs"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="block font-mono text-xs">{cpn.code}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{cpn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Personalized Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Hey, we noticed you left items in your cart! Here is an exclusive discount code to complete your order today..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecoveryCart(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send Recovery Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Abandoned Carts Recovery
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Recover lost sales, send recovery incentives, and monitor left-behind checkouts
            </p>
          </div>
        </div>

        {/* Right Side: Total Carts, Potential Revenue, Recent 24h Badges & Export CSV */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <ShoppingCart size={14} className="text-gray-400" />
            <span className="text-gray-400 font-medium">Abandoned Carts:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {totalCarts}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Potential Revenue:</span>
            <span className="font-black text-emerald-700 dark:text-emerald-300">
              {formatPrice(totalRevenue)}
            </span>
          </div>

          {recent24h > 0 && (
            <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">Recent 24h:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {recent24h}
              </span>
            </div>
          )}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Export to CSV"
          >
            <Download size={14} className="text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = filterTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setFilterTab(tab.value);
                  setPage(1);
                }}
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
            placeholder="Search customer, email, product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Actionable Abandoned Carts Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5"></th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Cart Items</th>
                <th className="px-4 py-3.5">Total Value</th>
                <th className="px-4 py-3.5">Last Active</th>
                <th className="px-4 py-3.5 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No abandoned carts found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All users have completed checkout or no carts match the current search filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCarts.map((cart) => {
                  const isExpanded = expandedId === cart.userId;
                  const logDate = new Date(cart.lastActive);
                  const timeAgo = formatDistanceToNow(logDate, { addSuffix: true });
                  const initials = cart.userName
                    ? cart.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "US";

                  return (
                    <React.Fragment key={cart.userId}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : cart.userId)}
                        className={cn(
                          "transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50 cursor-pointer group",
                          isExpanded && "bg-indigo-50/20 dark:bg-indigo-950/20"
                        )}
                      >
                        {/* Expand Chevron */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            className={cn(
                              "p-1 rounded-md text-gray-400 hover:text-indigo-600 transition-transform",
                              isExpanded && "rotate-180 text-indigo-600"
                            )}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                                {cart.userName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {cart.userEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cart Items Pill */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
                              <Package size={13} className="text-gray-400" />
                              <span>{cart.itemsCount} {cart.itemsCount === 1 ? "Item" : "Items"}</span>
                            </span>
                            <span className="text-[11px] text-gray-400 hidden sm:inline truncate max-w-[180px]">
                              {cart.items.map((i) => i.productName).join(", ")}
                            </span>
                          </div>
                        </td>

                        {/* Total Value */}
                        <td className="px-4 py-3.5">
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {formatPrice(cart.totalAmount)}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {format(logDate, "MMM d, HH:mm")}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {timeAgo}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`mailto:${cart.userEmail}?subject=You left items in your cart at Input Gears!`}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Direct Email"
                            >
                              <Mail size={15} />
                            </a>

                            <button
                              onClick={() => setSelectedRecoveryCart(cart)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Send size={12} />
                              <span>Send Recovery</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Cart Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 dark:bg-gray-800/40">
                          <td colSpan={6} className="px-6 py-4 border-t border-gray-200/60 dark:border-gray-700">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                  <Package size={13} className="text-indigo-500" /> Left Behind Cart Items ({cart.itemsCount})
                                </span>
                                {cart.userPhone && (
                                  <span className="text-gray-400 font-normal normal-case flex items-center gap-1">
                                    <Phone size={12} /> {cart.userPhone}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {cart.items.map((item) => (
                                  <div
                                    key={item.productId}
                                    className="p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3"
                                  >
                                    <div className="relative w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                                      {item.image ? (
                                        <Image
                                          src={item.image}
                                          alt={item.productName}
                                          fill
                                          className="object-contain p-0.5"
                                        />
                                      ) : (
                                        <Package size={18} className="m-auto text-gray-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                                        {item.productName}
                                      </p>
                                      <p className="text-[11px] text-gray-400 mt-0.5">
                                        Qty: <strong>{item.quantity}</strong> × {formatPrice(item.price)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer */}
        {filteredCarts.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-400">
              Showing <strong>{paginatedCarts.length}</strong> of <strong>{filteredCarts.length}</strong> abandoned checkouts
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="px-3 py-1 font-bold text-gray-900 dark:text-white">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
