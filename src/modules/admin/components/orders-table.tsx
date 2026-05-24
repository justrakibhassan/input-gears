"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteOrders } from "@/modules/admin/actions";
import OrderStatusSelector from "./order-status-selector";
import { cn } from "@/lib/utils";

interface OrderWithUser {
  id: string;
  orderNumber: string;
  name: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  } | null;
}

interface OrdersTableProps {
  orders: OrderWithUser[];
}

import { AlertModal } from "@/components/ui/alert-modal";

export default function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected =
    orders.length > 0 && selectedIds.length === orders.length;

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

  // Selection handlers
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const res = await deleteOrders(selectedIds);
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
        title="Delete Selected Orders?"
        description={`This action cannot be undone. You are about to delete ${selectedIds.length} orders permanently.`}
      />
      {/* --- Bulk Actions Floating Bar --- */}
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
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("orderNumber")}
              >
                <div className="flex items-center gap-2">
                  Order ID {getSortIcon("orderNumber")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Customer {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Date {getSortIcon("createdAt")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("totalAmount")}
              >
                <div className="flex items-center gap-2">
                  Total {getSortIcon("totalAmount")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("paymentStatus")}
              >
                <div className="flex items-center gap-2">
                  Payment {getSortIcon("paymentStatus")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Fulfillment {getSortIcon("status")}
                </div>
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const isSelected = selectedIds.includes(order.id);
              return (
                <tr
                  key={order.id}
                  className={cn(
                    "hover:bg-indigo-50/30 transition-colors group",
                    isSelected && "bg-indigo-50/50"
                  )}
                >
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-gray-900 text-sm tracking-tighter">
                      #{order.orderNumber.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-200">
                        {(order.user?.name || order.name || "G")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-sm uppercase tracking-tight">
                          {order.user?.name || order.name || "Guest User"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {order.user?.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-indigo-600">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {order.paymentStatus === "PAID" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-600 border border-green-100 text-[9px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest">
                        <AlertCircle size={12} /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <OrderStatusSelector
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-xl transition-all">
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
    </div>
  );
}
