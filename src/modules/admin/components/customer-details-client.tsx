"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  User as UserIcon,
  Ban,
  CheckCircle,
  Eye,
  Pencil,
  Clock,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toggleBanUser } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import EditCustomerModal from "./edit-customer-modal";
import ChangeRoleModal from "./change-role-modal";
import { UserRole } from "@prisma/client";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
}

interface UserWithOrders {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  role: UserRole;
  banned: boolean | null;
  phone: string | null;
  emailVerified: boolean;
  banReason: string | null;
  orders: Order[];
}

interface CustomerDetailsClientProps {
  user: UserWithOrders;
}

export default function CustomerDetailsClient({ user }: CustomerDetailsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog / Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  // Calculations
  const totalSpent = user.orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalOrders = user.orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const isVIP = totalSpent > 500;

  const handleToggleBan = () => {
    startTransition(async () => {
      try {
        const res = await toggleBanUser(user.id, !user.banned, "Administrative toggle");
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to update account ban status");
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 1. Sub-Header Back Button */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors group"
        >
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/20 group-hover:border-indigo-100 transition-all">
            <ArrowLeft size={14} />
          </div>
          Back to Customers List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- LEFT COLUMN: PROFILE CARD & ACTION CENTER --- */}
        <div className="lg:sticky lg:top-6 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
            {/* Header role colored ring */}
            <div className="flex flex-col items-center text-center mt-4">
              <div className={cn(
                "h-24 w-24 rounded-full p-1 border-2 mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 relative",
                user.role === "SUPER_ADMIN" && "border-rose-500",
                user.role === "MANAGER" && "border-amber-500",
                user.role === "CONTENT_EDITOR" && "border-blue-500",
                user.role === "USER" && "border-indigo-500"
              )}>
                <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-white dark:bg-gray-900">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserIcon size={36} className="text-gray-300 dark:text-gray-700" />
                  )}
                </div>
                {isVIP && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                    VIP
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                {user.name}
              </h2>
              <p className="text-xs text-gray-400 mb-6">{user.email}</p>
            </div>

            {/* Profile Detail Fields */}
            <div className="border-t border-gray-50 dark:border-gray-800 pt-6 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Role</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-white dark:bg-gray-900",
                  user.role === "SUPER_ADMIN" && "text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-900/30",
                  user.role === "MANAGER" && "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900/30",
                  user.role === "CONTENT_EDITOR" && "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/30",
                  user.role === "USER" && "text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-900/30"
                )}>
                  {user.role === "SUPER_ADMIN" ? "Admin" : user.role === "MANAGER" ? "Manager" : user.role === "CONTENT_EDITOR" ? "Editor" : "User"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border",
                  user.banned
                    ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                )}>
                  {user.banned ? "Banned" : "Active"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Phone</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {user.phone || "Not linked"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Member Since</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                  <Calendar size={12} className="text-gray-400" />
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {user.banned && user.banReason && (
                <div className="mt-4 p-3 bg-red-50/50 dark:bg-red-950/15 border border-red-100/50 dark:border-red-900/20 rounded-xl text-xs">
                  <span className="font-bold text-red-700 dark:text-red-400 block mb-1">Ban Reason:</span>
                  <span className="text-gray-600 dark:text-gray-300">{user.banReason}</span>
                </div>
              )}
            </div>

            {/* Action Center Grid */}
            <div className="border-t border-gray-50 dark:border-gray-800 pt-6 mt-6 space-y-3">
              <button
                onClick={() => setIsEditOpen(true)}
                className="w-full h-11 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs active:scale-98"
              >
                <Pencil size={14} /> Edit Profile Details
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsRoleOpen(true)}
                  className="h-11 inline-flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800/80 rounded-xl text-xs font-bold transition-colors active:scale-98"
                >
                  <Shield size={14} /> Change Role
                </button>

                <button
                  onClick={handleToggleBan}
                  disabled={isPending}
                  className={cn(
                    "h-11 inline-flex items-center justify-center gap-2 border rounded-xl text-xs font-bold transition-all active:scale-98 disabled:opacity-50",
                    user.banned
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-50/50 border-red-100 text-red-600 hover:bg-red-50 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-400"
                  )}
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : user.banned ? (
                    <>
                      <CheckCircle size={14} /> Unban Account
                    </>
                  ) : (
                    <>
                      <Ban size={14} /> Ban Account
                    </>
                  )}
                </button>
              </div>

              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Mail size={14} /> Send direct Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ANALYTICS & TIMELINE ACTIVITY --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-semibold">Total Orders</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                {totalOrders}
              </h4>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-semibold">Average Order Value</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp size={16} />
                </div>
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                ${avgOrderValue.toFixed(0)}
              </h4>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-semibold">Total Revenue</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
                  <CreditCard size={16} />
                </div>
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                ${totalSpent.toLocaleString()}
              </h4>
            </div>
          </div>

          {/* Activity/Purchase Timeline Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600 animate-pulse" />
              Customer Activity Timeline
            </h3>

            {user.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-700 mb-4 border border-gray-100 dark:border-gray-800/80">
                  <ShoppingBag size={28} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  No purchases yet
                </h4>
                <p className="text-xs text-gray-400 max-w-[240px]">
                  This user account has not completed any orders in the store catalog.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
                {user.orders.map((order, orderIdx) => (
                  <div key={order.id} className="relative group/item">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors group-hover/item:border-indigo-600">
                      <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700 group-hover/item:bg-indigo-600 transition-colors" />
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 border border-gray-100/50 dark:border-gray-800/80 rounded-2xl p-4 transition-all duration-300 hover:shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                            #{order.orderNumber.slice(-4).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {order.items.length} Product{order.items.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="flex flex-col items-start sm:items-end">
                            <span className="text-sm font-bold text-indigo-600 tabular-nums">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              order.status === "DELIVERED" && "bg-emerald-50/60 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
                              order.status === "CANCELLED" && "bg-rose-50/60 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
                              order.status !== "DELIVERED" && order.status !== "CANCELLED" && "bg-indigo-50/60 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                            )}>
                              {order.status}
                            </span>
                          </div>

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                            title="View Order details"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <EditCustomerModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        }}
      />

      <ChangeRoleModal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
    </div>
  );
}
