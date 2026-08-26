"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Package,
  Eye,
  Check,
  X,
  AlertTriangle,
  FileText,
  User,
  ShoppingBag,
  ArrowRight,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ReturnItem {
  id: string;
  orderNumber: string;
  orderId?: string;
  customer: string;
  email: string;
  phone?: string;
  item: string;
  itemImage?: string;
  reason: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REFUNDED" | "REJECTED";
  date: string;
  trackingNumber?: string;
  notes?: string;
}

const initialReturns: ReturnItem[] = [
  {
    id: "RET-1001",
    orderNumber: "ORD-9842",
    orderId: "ord-9842",
    customer: "Rahim Ahmed",
    email: "rahim@example.com",
    phone: "+880 1712 345678",
    item: "Wireless Mechanical Keyboard (RGB)",
    reason: "Defective switch on spacebar, key registers multiple times",
    amount: 149.99,
    status: "PENDING",
    date: "2026-08-01",
    trackingNumber: "TRK-8829104",
    notes: "Customer reported issue 3 days after unboxing.",
  },
  {
    id: "RET-1002",
    orderNumber: "ORD-9810",
    orderId: "ord-9810",
    customer: "Tanvir Hossain",
    email: "tanvir@example.com",
    phone: "+880 1823 456789",
    item: "Ultra-Fast Ergonomic Gaming Mouse",
    reason: "Ordered wrong model size, wants lighter version",
    amount: 79.50,
    status: "APPROVED",
    date: "2026-07-29",
    trackingNumber: "TRK-7719203",
    notes: "Product returned in original packaging with seals intact.",
  },
  {
    id: "RET-1003",
    orderNumber: "ORD-9755",
    orderId: "ord-9755",
    customer: "Nusrat Jahan",
    email: "nusrat@example.com",
    phone: "+880 1934 567890",
    item: "PBT Keycap Set (Retro Cyan)",
    reason: "Changed mind before unboxing, unopened package",
    amount: 45.00,
    status: "REFUNDED",
    date: "2026-07-25",
    trackingNumber: "TRK-6610294",
    notes: "Refund processed via Original Payment Method.",
  },
  {
    id: "RET-1004",
    orderNumber: "ORD-9690",
    orderId: "ord-9690",
    customer: "Sajjad Karim",
    email: "sajjad@example.com",
    phone: "+880 1645 678901",
    item: "Desk Mat (Minimalist Black)",
    reason: "Damaged during transit, packaging torn",
    amount: 29.99,
    status: "REJECTED",
    date: "2026-07-20",
    trackingNumber: "TRK-5519201",
    notes: "Return requested 45 days after delivery (exceeds 14-day policy).",
  },
  {
    id: "RET-1005",
    orderNumber: "ORD-9640",
    orderId: "ord-9640",
    customer: "Fahim Hasan",
    email: "fahim@example.com",
    phone: "+880 1798 123456",
    item: "Audiophile Studio Headset (Open Back)",
    reason: "Right audio driver crackles at high frequencies",
    amount: 189.00,
    status: "PENDING",
    date: "2026-08-03",
    trackingNumber: "TRK-9920194",
    notes: "Awaiting audio team hardware inspection.",
  },
];

export default function ReturnsManager() {
  const [returnsList, setReturnsList] = useState<ReturnItem[]>(initialReturns);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [rejectModalReturn, setRejectModalReturn] = useState<ReturnItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [refundModalReturn, setRefundModalReturn] = useState<ReturnItem | null>(null);

  // Status Counts
  const pendingCount = returnsList.filter((r) => r.status === "PENDING").length;
  const approvedCount = returnsList.filter((r) => r.status === "APPROVED").length;
  const refundedCount = returnsList.filter((r) => r.status === "REFUNDED").length;
  const rejectedCount = returnsList.filter((r) => r.status === "REJECTED").length;
  const totalRefundedAmount = returnsList
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + r.amount, 0);

  // Filtered List
  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.orderNumber.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [returnsList, statusFilter, searchQuery]);

  // Action: Approve Return
  const handleApprove = (ret: ReturnItem) => {
    setReturnsList((prev) =>
      prev.map((r) =>
        r.id === ret.id ? { ...r, status: "APPROVED" as const } : r
      )
    );
    if (selectedReturn?.id === ret.id) {
      setSelectedReturn((prev) =>
        prev ? { ...prev, status: "APPROVED" } : null
      );
    }
    toast.success(`Return ${ret.id} approved!`, {
      description: `Order ${ret.orderNumber} is now approved for return shipment.`,
    });
  };

  // Action: Confirm Reject
  const handleConfirmReject = () => {
    if (!rejectModalReturn) return;
    const ret = rejectModalReturn;

    setReturnsList((prev) =>
      prev.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: "REJECTED" as const,
              notes: rejectReason
                ? `Rejected: ${rejectReason}`
                : r.notes || "Return request rejected by store admin.",
            }
          : r
      )
    );

    if (selectedReturn?.id === ret.id) {
      setSelectedReturn((prev) =>
        prev ? { ...prev, status: "REJECTED" } : null
      );
    }

    toast.error(`Return ${ret.id} rejected.`, {
      description: `Notification sent to ${ret.email}.`,
    });
    setRejectModalReturn(null);
    setRejectReason("");
  };

  // Action: Confirm Refund
  const handleConfirmRefund = () => {
    if (!refundModalReturn) return;
    const ret = refundModalReturn;

    setReturnsList((prev) =>
      prev.map((r) =>
        r.id === ret.id ? { ...r, status: "REFUNDED" as const } : r
      )
    );

    if (selectedReturn?.id === ret.id) {
      setSelectedReturn((prev) =>
        prev ? { ...prev, status: "REFUNDED" } : null
      );
    }

    toast.success(`Refund of $${ret.amount.toFixed(2)} processed!`, {
      description: `Amount refunded to ${ret.customer} for order ${ret.orderNumber}.`,
    });
    setRefundModalReturn(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Requests */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={cn(
            "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all",
            statusFilter === "PENDING"
              ? "border-amber-400 ring-2 ring-amber-400/20"
              : "border-gray-200/80 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Pending Review
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {pendingCount}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              Requires approval
            </span>
          </div>
        </div>

        {/* Approved Returns */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={cn(
            "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all",
            statusFilter === "APPROVED"
              ? "border-blue-400 ring-2 ring-blue-400/20"
              : "border-gray-200/80 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Approved
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
              {approvedCount}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              Ready for refund
            </span>
          </div>
        </div>

        {/* Total Refunded */}
        <div
          onClick={() => setStatusFilter("REFUNDED")}
          className={cn(
            "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all",
            statusFilter === "REFUNDED"
              ? "border-emerald-400 ring-2 ring-emerald-400/20"
              : "border-gray-200/80 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Total Refunded
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              ${totalRefundedAmount.toFixed(2)}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              {refundedCount} refunds settled
            </span>
          </div>
        </div>

        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all",
            statusFilter === "ALL"
              ? "border-indigo-400 ring-2 ring-indigo-400/20"
              : "border-gray-200/80 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Total Requests
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <RotateCcw size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {returnsList.length}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              All return cases
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Search & Status Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All", count: returnsList.length },
            { key: "PENDING", label: "Pending", count: pendingCount },
            { key: "APPROVED", label: "Approved", count: approvedCount },
            { key: "REFUNDED", label: "Refunded", count: refundedCount },
            { key: "REJECTED", label: "Rejected", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                statusFilter === tab.key
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return ID, order, name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Actionable Returns Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/80 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Return ID & Date</th>
                <th className="px-5 py-3.5">Customer & Order</th>
                <th className="px-5 py-3.5">Item & Reason</th>
                <th className="px-5 py-3.5">Refund Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((ret) => (
                  <tr
                    key={ret.id}
                    className="hover:bg-gray-50/70 transition-colors group"
                  >
                    {/* Return ID & Date */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-xs text-gray-900">
                        {ret.id}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-medium">
                        {ret.date}
                      </div>
                    </td>

                    {/* Customer & Order */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm">
                        {ret.customer}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-500">
                          {ret.email}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {ret.orderNumber}
                        </span>
                      </div>
                    </td>

                    {/* Item & Reason */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-gray-900 text-xs truncate">
                        {ret.item}
                      </p>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {ret.reason}
                      </p>
                    </td>

                    {/* Refund Amount */}
                    <td className="px-5 py-4 font-black text-gray-900 text-sm">
                      ${ret.amount.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          ret.status === "PENDING" &&
                            "bg-amber-50 text-amber-700 border border-amber-200",
                          ret.status === "APPROVED" &&
                            "bg-blue-50 text-blue-700 border border-blue-200",
                          ret.status === "REFUNDED" &&
                            "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          ret.status === "REJECTED" &&
                            "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {ret.status === "PENDING" && <Clock size={11} />}
                        {ret.status === "APPROVED" && <CheckCircle2 size={11} />}
                        {ret.status === "REFUNDED" && <DollarSign size={11} />}
                        {ret.status === "REJECTED" && <XCircle size={11} />}
                        <span>{ret.status}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Action buttons based on status */}
                        {ret.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(ret)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              title="Approve Return"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalReturn(ret);
                                setRejectReason("");
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              title="Reject Return"
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {ret.status === "APPROVED" && (
                          <>
                            <button
                              onClick={() => setRefundModalReturn(ret)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                              title="Process Refund"
                            >
                              <DollarSign size={12} />
                              <span>Refund</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalReturn(ret);
                                setRejectReason("");
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}

                        {ret.status === "REFUNDED" && (
                          <span className="text-[11px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-200">
                            Completed
                          </span>
                        )}

                        {ret.status === "REJECTED" && (
                          <button
                            onClick={() => handleApprove(ret)}
                            className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-200 transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No return requests found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Try searching with different keywords or changing filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Reject Confirmation Modal */}
      {rejectModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Reject Return Request
                </h3>
                <p className="text-xs text-gray-500">
                  {rejectModalReturn.id} • Order {rejectModalReturn.orderNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to reject the return for{" "}
              <strong className="text-gray-900">{rejectModalReturn.customer}</strong>?
              Please specify the reason below.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Rejection Reason (Customer will be notified)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Returned after the 14-day warranty policy / Items damaged by user..."
                className="w-full p-3 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-400 focus:outline-none min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalReturn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Process Refund Modal */}
      {refundModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Process Customer Refund
                </h3>
                <p className="text-xs text-gray-500">
                  {refundModalReturn.id} • Order {refundModalReturn.orderNumber}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-bold text-gray-900">{refundModalReturn.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item:</span>
                <span className="font-semibold text-gray-900 truncate max-w-[200px]">{refundModalReturn.item}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 pt-1.5 font-bold text-sm">
                <span className="text-gray-900">Total Refund Amount:</span>
                <span className="text-emerald-700">${refundModalReturn.amount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              This action will mark the return as <strong>REFUNDED</strong> and trigger the payment provider settlement for the original transaction.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalReturn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Return Request Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Return Case #{selectedReturn.id}
                </h3>
                <p className="text-xs text-gray-400">
                  Requested on {selectedReturn.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3.5 text-xs text-gray-700">
              {/* Status & Amount Box */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <div>
                  <span className="text-gray-500 block text-[11px]">Status</span>
                  <span className="font-bold text-sm text-gray-900">
                    {selectedReturn.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[11px]">Refund Value</span>
                  <span className="font-black text-base text-gray-900">
                    ${selectedReturn.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer & Order */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Customer & Order
                </span>
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-900">{selectedReturn.customer}</p>
                  <p className="text-gray-600">{selectedReturn.email} • {selectedReturn.phone}</p>
                  <p className="font-mono text-indigo-600 font-bold">Order #{selectedReturn.orderNumber}</p>
                </div>
              </div>

              {/* Product & Reason */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Product & Return Reason
                </span>
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-900">{selectedReturn.item}</p>
                  <p className="text-gray-600">{selectedReturn.reason}</p>
                  {selectedReturn.trackingNumber && (
                    <p className="text-gray-400 text-[11px] pt-1">
                      Tracking: <span className="font-mono">{selectedReturn.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReturn.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Admin Notes
                  </span>
                  <p className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-amber-900">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedReturn.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedReturn)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Approve Return</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalReturn(selectedReturn);
                        setRejectReason("");
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {selectedReturn.status === "APPROVED" && (
                  <button
                    onClick={() => setRefundModalReturn(selectedReturn)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    <DollarSign size={14} />
                    <span>Process Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
