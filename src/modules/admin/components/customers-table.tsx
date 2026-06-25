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
  Shield,
  Ban,
  CheckCircle,
  Pencil,
  Trash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { deleteUsers, toggleBanUser } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/alert-modal";
import EditCustomerModal from "./edit-customer-modal";
import ChangeRoleModal from "./change-role-modal";
import { UserRole } from "@prisma/client";

interface CustomerWithOrders {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  orders: { totalAmount: number }[];
  role: UserRole;
  banned: boolean | null;
  phone: string | null;
}

interface CustomersTableProps {
  customers: CustomerWithOrders[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Active Dropdown & Modal States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<CustomerWithOrders | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<CustomerWithOrders | null>(null);
  const [deletingUser, setDeletingUser] = useState<CustomerWithOrders | null>(null);

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
  const handleBulkDeleteConfirm = () => {
    startTransition(async () => {
      const res = await deleteUsers(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Single User Actions
  const handleSingleDeleteConfirm = () => {
    if (!deletingUser) return;
    startTransition(async () => {
      const res = await deleteUsers([deletingUser.id]);
      if (res.success) {
        toast.success("User deleted successfully!");
        setDeletingUser(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleToggleBan = (userId: string, isBanned: boolean) => {
    startTransition(async () => {
      try {
        const res = await toggleBanUser(userId, isBanned);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to change ban status");
      }
    });
  };

  return (
    <div className="relative">
      <AlertModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        loading={isPending}
        title="Delete Selected Customers?"
        description={`Are you sure you want to delete ${selectedIds.length} customers? This will permanently remove their accounts and profiles.`}
      />

      <AlertModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleSingleDeleteConfirm}
        loading={isPending}
        title="Delete User Account?"
        description={`Are you sure you want to delete ${deletingUser?.name || deletingUser?.email}'s account? This action cannot be undone.`}
      />

      {editingUser && (
        <EditCustomerModal
          isOpen={editingUser !== null}
          onClose={() => setEditingUser(null)}
          user={{
            id: editingUser.id,
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
            phone: editingUser.phone,
          }}
        />
      )}

      {changingRoleUser && (
        <ChangeRoleModal
          isOpen={changingRoleUser !== null}
          onClose={() => setChangingRoleUser(null)}
          user={{
            id: changingRoleUser.id,
            name: changingRoleUser.name,
            email: changingRoleUser.email,
            role: changingRoleUser.role,
          }}
        />
      )}

      {/* --- Bulk Actions Floating Bar --- */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10"
          >
            <div className="flex items-center gap-2 pr-6 border-r border-white/10 text-sm font-bold">
              <span className="bg-indigo-600 w-6 h-6 flex items-center justify-center rounded-full text-[10px]">
                {selectedIds.length}
              </span>
              Selected
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isPending}
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 p-2 rounded-xl transition-colors text-xs font-bold disabled:opacity-50"
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
                className="flex items-center gap-2 hover:bg-white dark:hover:bg-gray-900/10 p-2 rounded-xl transition-colors text-xs font-bold"
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
                className="px-6 py-4 font-bold text-xs cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Customer {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-4 font-bold text-xs cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Joined {getSortIcon("createdAt")}
                </div>
              </th>
              <th className="px-6 py-4 font-bold text-xs">
                Total Spent
              </th>
              <th className="px-6 py-4 font-bold text-xs">
                Orders
              </th>
              <th className="px-6 py-4 font-bold text-xs text-right">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {customer.name}
                          </span>
                          {customer.role !== "USER" && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-white dark:bg-gray-900 border shadow-xs",
                              customer.role === "SUPER_ADMIN" && "text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-900/30",
                              customer.role === "MANAGER" && "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900/30",
                              customer.role === "CONTENT_EDITOR" && "text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/30"
                            )}>
                              {customer.role === "SUPER_ADMIN" ? "Admin" : customer.role === "MANAGER" ? "Manager" : "Editor"}
                            </span>
                          )}
                          {customer.banned && (
                            <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-xs dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30 animate-pulse">
                              Banned
                            </span>
                          )}
                          {isVIP && (
                            <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-xs dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs font-medium">
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
                        title="Email Customer"
                      >
                        <Mail size={18} />
                      </a>
                      
                      {/* Action Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === customer.id ? null : customer.id)}
                          className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
                          title="More Actions"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        
                        {activeDropdownId === customer.id && (
                          <>
                            {/* Backdrop overlay to close dropdown when clicking outside */}
                            <div 
                              className="fixed inset-0 z-40 bg-transparent" 
                              onClick={() => setActiveDropdownId(null)}
                            />
                            
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => {
                                  setEditingUser(customer);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                              >
                                <Pencil size={14} className="text-gray-400" />
                                Edit Details
                              </button>
                              
                              <button
                                onClick={() => {
                                  setChangingRoleUser(customer);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                              >
                                <Shield size={14} className="text-gray-400" />
                                Change Role
                              </button>
                              
                              <button
                                onClick={() => {
                                  handleToggleBan(customer.id, !customer.banned);
                                  setActiveDropdownId(null);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 transition-colors",
                                  customer.banned 
                                    ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                                    : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                )}
                              >
                                {customer.banned ? (
                                  <>
                                    <CheckCircle size={14} />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban size={14} />
                                    Ban User
                                  </>
                                )}
                              </button>
                              
                              <div className="border-t border-gray-50 dark:border-gray-800 my-1" />
                              
                              <button
                                onClick={() => {
                                  setDeletingUser(customer);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                              >
                                <Trash size={14} />
                                Delete Account
                              </button>
                            </div>
                          </>
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
    </div>
  );
}
