"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Plus,
  Trash2,
  Ticket,
  RefreshCcw,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Search,
  BarChart3,
  Award,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  getCoupons, 
  createCoupon, 
  deleteCoupon, 
  toggleCouponStatus 
} from "@/modules/admin/actions";
import { Coupon } from "@prisma/client";
import CouponSkeleton from "./coupon-skeleton";

const demoFallbackCoupons: Coupon[] = [
  {
    id: "demo-1",
    code: "WELCOME10",
    type: "PERCENTAGE",
    value: 10,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    usageLimit: 100,
    usageCount: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-2",
    code: "GEARUP20",
    type: "FIXED",
    value: 20,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    isActive: true,
    usageLimit: 50,
    usageCount: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-3",
    code: "FLASH50",
    type: "PERCENTAGE",
    value: 15,
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isActive: true,
    usageLimit: 30,
    usageCount: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-4",
    code: "VIPOFFER",
    type: "FIXED",
    value: 50,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: false,
    usageLimit: 10,
    usageCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface CouponManagerProps {
  initialCoupons: Coupon[];
}

export default function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(
    initialCoupons.length > 0 ? initialCoupons : demoFallbackCoupons
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAnalyticsSection, setShowAnalyticsSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "disabled">("all");

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: 0,
    expiresAt: "",
    usageLimit: "",
  });

  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function loadCoupons() {
    setIsLoading(true);
    try {
      const data = await getCoupons();
      if (data && data.length > 0) {
        setCoupons(data as Coupon[]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (initialCoupons.length === 0) {
      loadCoupons();
    }
  }, [initialCoupons]);

  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setNewCoupon({ ...newCoupon, code });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || newCoupon.value <= 0 || !newCoupon.expiresAt) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    const res = await createCoupon({
      ...newCoupon,
      value: Number(newCoupon.value),
      expiresAt: new Date(newCoupon.expiresAt),
      usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined,
    });

    if (res.success) {
      toast.success("Coupon created successfully!");
      setNewCoupon({ code: "", type: "PERCENTAGE", value: 0, expiresAt: "", usageLimit: "" });
      setShowAddForm(false);
      loadCoupons();
    } else {
      toast.error(res.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    const res = await deleteCoupon(id);
    if (res.success) {
      toast.success("Coupon deleted");
      loadCoupons();
    } else {
      toast.error(res.message);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleCouponStatus(id, !currentStatus);
    if (res.success) {
      loadCoupons();
    } else {
      toast.error(res.message);
    }
  };

  // Stats
  const activeCouponsCount = useMemo(() => {
    if (now === 0) return coupons.filter((c) => c.isActive).length;
    return coupons.filter((c) => c.isActive && new Date(c.expiresAt).getTime() > now).length;
  }, [coupons, now]);

  const totalTimesUsed = useMemo(() => {
    return coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  }, [coupons]);

  const expiredCount = useMemo(() => {
    if (now === 0) return 0;
    return coupons.filter((c) => new Date(c.expiresAt).getTime() <= now).length;
  }, [coupons, now]);

  const disabledCount = useMemo(() => {
    return coupons.filter((c) => !c.isActive).length;
  }, [coupons]);

  const topUsedCoupons = useMemo(() => {
    return [...coupons]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  }, [coupons]);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const isExpired = now > 0 && new Date(coupon.expiresAt).getTime() <= now;

      if (statusFilter === "active") return coupon.isActive && !isExpired;
      if (statusFilter === "expired") return isExpired;
      if (statusFilter === "disabled") return !coupon.isActive;

      return true;
    });
  }, [coupons, searchQuery, statusFilter, now]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
  };

  const TABS = [
    { key: "all" as const, label: "All Coupons", count: coupons.length },
    { key: "active" as const, label: "Active", count: activeCouponsCount },
    { key: "expired" as const, label: "Expired", count: expiredCount },
    { key: "disabled" as const, label: "Disabled", count: disabledCount },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Ticket size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Coupons & Discounts
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage promo codes, usage limits, and monitor discount performance
            </p>
          </div>
        </div>

        {/* Right Side: Total Coupons, Active, Usage Badges & Create Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {coupons.length}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {activeCouponsCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/60 rounded-xl shadow-2xs text-xs font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-medium">Uses:</span>
            <span className="font-black text-purple-700 dark:text-purple-300">
              {totalTimesUsed}
            </span>
          </div>

          <button
            onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs",
              showAnalyticsSection
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-gray-800 hover:bg-gray-50"
            )}
            title="Toggle Analytics Drawer"
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
              showAddForm 
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
          >
            {showAddForm ? <><X size={14} /> Close</> : <><Plus size={14} /> Create Coupon</>}
          </button>
        </div>
      </div>

      {/* Analytics Drawer (Toggleable) */}
      {showAnalyticsSection && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl p-5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Award size={15} className="text-amber-500" />
              Most Popular Coupons Leaderboard
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Real-time checkout usage performance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topUsedCoupons.map((coupon, index) => {
              const limit = coupon.usageLimit || 100;
              const percent = Math.min(100, Math.round(((coupon.usageCount || 0) / limit) * 100));

              return (
                <div
                  key={coupon.id}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white font-mono truncate">{coupon.code}</p>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900 dark:text-white">{coupon.usageCount} uses</span>
                    <span className="text-[10px] text-gray-400 block">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Coupon Drawer */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Create New Promo Coupon
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Code */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Coupon Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER25"
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono font-bold focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                    title="Generate Random Code"
                  >
                    <RefreshCcw size={13} />
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Discount Type
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Value ({newCoupon.type === "PERCENTAGE" ? "%" : "$"})
                </label>
                <input
                  type="number"
                  value={newCoupon.value || ""}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none"
                  placeholder="20"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={newCoupon.expiresAt}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Limit & Submit */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                    Limit (Qty)
                  </label>
                  <input
                    type="number"
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 h-[34px]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* 3. Actionable Coupons Table */}
      {isLoading ? (
        <CouponSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Discount Value</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Usage Analytics</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500">
                      <Ticket size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">No coupons found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try changing filters or create a new coupon code.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isExpired = now > 0 && new Date(coupon.expiresAt).getTime() <= now;
                    const limit = coupon.usageLimit || 100;
                    const percent = Math.min(100, Math.round(((coupon.usageCount || 0) / limit) * 100));

                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        {/* Coupon Code */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {coupon.code.slice(0, 2)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => copyCode(coupon.code)}
                                className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Copy code"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Type & Value */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                coupon.type === "PERCENTAGE"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              )}
                            >
                              {coupon.type}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                              {coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                            </span>
                          </div>
                        </td>

                        {/* Expiry Date */}
                        <td className="px-5 py-4 text-xs">
                          <span
                            className={cn(
                              "font-semibold",
                              isExpired ? "text-rose-500" : "text-gray-600 dark:text-gray-300"
                            )}
                          >
                            {new Date(coupon.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Usage Analytics */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col max-w-[160px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-900 dark:text-white font-mono">
                                {coupon.usageCount || 0} uses
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {coupon.usageLimit ? `Max: ${coupon.usageLimit}` : "No limit"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              !coupon.isActive
                                ? "bg-gray-100 text-gray-600 border border-gray-200"
                                : isExpired
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}
                          >
                            {!coupon.isActive ? "Disabled" : isExpired ? "Expired" : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggle(coupon.id, coupon.isActive)}
                              className={cn(
                                "p-1 rounded-lg transition-colors cursor-pointer",
                                coupon.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
                              )}
                              title={coupon.isActive ? "Disable coupon" : "Enable coupon"}
                            >
                              {coupon.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>

                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete coupon"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
