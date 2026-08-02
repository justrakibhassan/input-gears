"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Plus,
  Trash2,
  Ticket,
  RefreshCcw,
  Calendar,
  Percent,
  DollarSign,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Check,
  X
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

// Demo fallback data if database currently has no coupons created
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
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // expired
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
  const [showAnalyticsSection, setShowAnalyticsSection] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "expired" | "disabled">("all");

  // Form State
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: 0,
    expiresAt: "",
    usageLimit: "",
  });

  // Client timestamp for stable calculations
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

  // Analytics Stats
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

  // Top Most Used Coupons Leaderboard
  const topUsedCoupons = useMemo(() => {
    return [...coupons]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  }, [coupons]);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      // Search Code
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const isExpired = now > 0 && new Date(coupon.expiresAt).getTime() <= now;

      if (statusFilter === "active") return coupon.isActive && !isExpired;
      if (statusFilter === "expired") return isExpired;
      if (statusFilter === "disabled") return !coupon.isActive;
      if (statusFilter === "scheduled") return coupon.isActive && !isExpired && (coupon.usageCount || 0) === 0;

      return true;
    });
  }, [coupons, searchQuery, statusFilter, now]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <Ticket size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Coupons & Discounts
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Manage promo codes, view usage analytics, and monitor discount performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
              showAnalyticsSection
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <BarChart3 size={18} />
            {showAnalyticsSection ? "Hide Usage Analytics" : "Show Usage Analytics"}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0",
              showAddForm 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" 
                : "bg-gray-900 dark:bg-indigo-600 text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 shadow-lg dark:shadow-none shadow-gray-200"
            )}
          >
            {showAddForm ? "Cancel" : <><Plus size={18} /> Create Coupon</>}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Total Coupons
            </p>
            <Ticket size={18} className="text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
            {coupons.length}
          </p>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
            Created in system
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Active Coupons
            </p>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {activeCouponsCount}
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Ready for checkout redeem
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              Total Usage Count
            </p>
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-700 dark:text-purple-300">
            {totalTimesUsed} <span className="text-sm font-medium text-purple-500">times</span>
          </p>
          <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
            Total successful redemptions
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Expired Coupons
            </p>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
            {expiredCount}
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
            Past expiration date
          </p>
        </div>
      </div>

      {/* DETAILED USAGE ANALYTICS SECTION */}
      {showAnalyticsSection && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-gray-900 dark:text-white text-base">
                Usage Analytics & Leaderboard
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Real-time checkout usage performance
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Leaderboard */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" /> Most Popular Coupons
              </h3>

              <div className="space-y-3">
                {topUsedCoupons.map((coupon, index) => {
                  const limit = coupon.usageLimit || 100;
                  const percent = Math.min(100, Math.round(((coupon.usageCount || 0) / limit) * 100));

                  return (
                    <div
                      key={coupon.id}
                      className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
                            index === 0
                              ? "bg-amber-400 text-amber-950"
                              : index === 1
                              ? "bg-slate-300 text-slate-900"
                              : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          )}
                        >
                          #{index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white font-mono">
                              {coupon.code}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                              {coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-gray-900 dark:text-white font-mono">
                          {coupon.usageCount} <span className="text-xs font-normal text-gray-500">uses</span>
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400">
                          {coupon.usageLimit ? `${percent}% of ${coupon.usageLimit} max` : "Unlimited limit"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Usage Summary Insights */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap size={14} className="text-indigo-500" /> Usage Summary
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700/60 pb-3">
                    <span className="text-gray-500 dark:text-gray-400">Total Redemptions</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">{totalTimesUsed} times</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700/60 pb-3">
                    <span className="text-gray-500 dark:text-gray-400">Avg Uses / Coupon</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {coupons.length > 0 ? (totalTimesUsed / coupons.length).toFixed(1) : 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700/60 pb-3">
                    <span className="text-gray-500 dark:text-gray-400">Active Campaign Rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {coupons.length > 0 ? Math.round((activeCouponsCount / coupons.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
                <span>Usage stats update automatically whenever buyers enter codes at checkout.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Create New Discount Coupon
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Code */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Coupon Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="E.g. SUMMER25"
                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                    title="Generate Random Code"
                  >
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Discount Type
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Discount Value
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {newCoupon.type === "PERCENTAGE" ? <Percent size={14} /> : <DollarSign size={14} />}
                  </div>
                  <input
                    type="number"
                    value={newCoupon.value || ""}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Limit */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  value={newCoupon.usageLimit}
                  onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg dark:shadow-none shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Coupon"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by coupon code..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          {(["all", "active", "scheduled", "expired", "disabled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0",
                statusFilter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <CouponSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type & Value
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage Analytics (Times Used)
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                      <Ticket size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-semibold text-sm">No matching coupons found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isExpired = now > 0 && new Date(coupon.expiresAt).getTime() <= now;

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs border border-indigo-100 dark:border-indigo-900/50">
                              {coupon.code.slice(0, 2)}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white font-mono text-base tracking-wide">
                              {coupon.code}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                              coupon.type === "PERCENTAGE" 
                                ? "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40" 
                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40"
                            )}>
                              {coupon.type}
                            </span>
                            <span className="font-black text-gray-900 dark:text-white text-sm">
                              {coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-sm font-semibold",
                            isExpired ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {new Date(coupon.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col max-w-[160px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-black text-gray-900 dark:text-white font-mono">
                                {coupon.usageCount} times
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {coupon.usageLimit ? `Limit: ${coupon.usageLimit}` : "No limit"}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                                style={{ width: `${coupon.usageLimit ? Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100) : 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            !coupon.isActive
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                              : isExpired
                              ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {!coupon.isActive ? "Disabled" : isExpired ? "Expired" : "Active"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggle(coupon.id, coupon.isActive)}
                              className={cn(
                                "p-1.5 rounded-xl transition-colors",
                                coupon.isActive ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                              title={coupon.isActive ? "Disable Coupon" : "Enable Coupon"}
                            >
                              {coupon.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                            </button>

                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                              title="Delete Coupon"
                            >
                              <Trash2 size={16} />
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
