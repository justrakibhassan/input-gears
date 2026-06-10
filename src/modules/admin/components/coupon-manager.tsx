"use client";

import { useState, useEffect } from "react";
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
  ToggleRight
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

interface CouponManagerProps {
  initialCoupons: Coupon[];
}

export default function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: 0,
    expiresAt: "",
    usageLimit: "",
  });

  async function loadCoupons() {
    setIsLoading(true);
    try {
      const data = await getCoupons();
      setCoupons(data as Coupon[]);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Ticket size={20} className="text-indigo-600" />
            Promo Coupons
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage discount codes for your customers.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            showAddForm 
              ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200" 
              : "bg-gray-900 text-white hover:bg-indigo-600 shadow-lg dark:shadow-none shadow-gray-200"
          )}
        >
          {showAddForm ? "Cancel" : <><Plus size={18} /> Add Coupon</>}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none animate-in slide-in-from-top-4 duration-300">
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
                    placeholder="E.g. SUMMER10"
                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-indigo-500 rounded-lg transition-colors"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Value
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {newCoupon.type === "PERCENTAGE" ? <Percent size={14} /> : <DollarSign size={14} />}
                  </div>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Expires On
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all"
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

      {/* List */}
      {isLoading ? (
        <CouponSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coupon Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type & Value</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                      No coupons found. Create your first one above!
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 dark:bg-gray-800/50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-mono font-bold text-xs border border-indigo-100">
                            {coupon.code.slice(0, 2)}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white font-mono underline decoration-indigo-200 decoration-2 underline-offset-2">
                            {coupon.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                            coupon.type === "PERCENTAGE" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {coupon.type}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm font-medium",
                          new Date(coupon.expiresAt) < new Date() ? "text-red-500" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ""}</span>
                          <div className="w-20 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500" 
                              style={{ width: `${coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(coupon.id, coupon.isActive)}
                          className={cn(
                            "flex items-center gap-2 text-sm font-medium transition-colors",
                            coupon.isActive ? "text-emerald-600" : "text-gray-400"
                          )}
                        >
                          {coupon.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          {coupon.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
