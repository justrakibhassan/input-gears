"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Mail,
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  User,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteUsers } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/alert-modal";

interface CustomerWithOrders {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  orders: { totalAmount: number }[];
}

interface CustomersTableProps {
  customers: CustomerWithOrders[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAllSelected =
    customers.length > 0 && selectedIds.length === customers.length;

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
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const res = await deleteUsers(selectedIds);
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
        title="Delete Selected Customers?"
        description={`Are you sure you want to delete ${selectedIds.length} customers? This will permanently remove their accounts and profiles.`}
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
                className="flex items-center gap-2 hover:bg-white dark:hover:bg-gray-900/10 p-2 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
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
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
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
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Customer {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Joined {getSortIcon("createdAt")}
                </div>
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">
                Total Spent
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">
                Orders
              </th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {customers.map((customer) => {
              const totalSpent = customer.orders.reduce(
                (acc, order) => acc + order.totalAmount,
                0
              );
              const isSelected = selectedIds.includes(customer.id);
              const isVIP = totalSpent > 500;

              return (
                <tr
                  key={customer.id}
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
                      onChange={() => toggleSelectCustomer(customer.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center relative">
                        {customer.image ? (
                          <Image
                            src={customer.image}
                            alt={customer.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">
                            {customer.name}
                          </span>
                          {isVIP && (
                            <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest shadow-sm dark:shadow-none">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-indigo-600 tabular-nums">
                      ${totalSpent.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest">
                      {customer.orders.length} Orders
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      <a
                        href={`mailto:${customer.email}`}
                        className="p-2 text-gray-400 hover:text-azure-600 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
                      >
                        <Mail size={18} />
                      </a>
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
    </div>
  );
}
