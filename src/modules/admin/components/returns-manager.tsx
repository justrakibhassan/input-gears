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
    <div className="space-y-6 w-full">
      {/* 1. Page Header with Title on Left & Summary Pills on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Returns & Refunds
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Review return requests, approve shipments, and process customer refunds
            </p>
          </div>
        </div>

        {/* Right Side: Total Cases & Total Refunded Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total Cases:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {returnsList.length}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Total Refunded:
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300">
              ${totalRefundedAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                statusFilter === tab.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  statusFilter === tab.key
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
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
            placeholder="Search returns..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Actionable Returns Table (Full Width) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Return ID & Date</th>
                <th className="px-5 py-3.5">Customer & Order</th>
                <th className="px-5 py-3.5">Item & Reason</th>
                <th className="px-5 py-3.5">Refund Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((ret) => (
                  <tr
                    key={ret.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* Return ID & Date */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                        {ret.id}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-medium">
                        {ret.date}
                      </div>
                    </td>

                    {/* Customer & Order */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                        {ret.customer}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {ret.email}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {ret.orderNumber}
                        </span>
                      </div>
                    </td>

                    {/* Item & Reason */}
                    <td className="px-5 py-4 max-w-sm">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {ret.item}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {ret.reason}
                      </p>
                    </td>

                    {/* Refund Amount */}
                    <td className="px-5 py-4 font-black text-gray-900 dark:text-white text-sm">
                      ${ret.amount.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          ret.status === "PENDING" &&
                            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
                          ret.status === "APPROVED" &&
                            "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
                          ret.status === "REFUNDED" &&
                            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
                          ret.status === "REJECTED" &&
                            "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
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
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Action buttons based on status */}
                        {ret.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(ret)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
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
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
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
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
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
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}

                        {ret.status === "REFUNDED" && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-800">
                            Completed
                          </span>
                        )}

                        {ret.status === "REJECTED" && (
                          <button
                            onClick={() => handleApprove(ret)}
                            className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Reject Return Request
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {rejectModalReturn.id} • Order {rejectModalReturn.orderNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Are you sure you want to reject the return for{" "}
              <strong className="text-gray-900 dark:text-white">{rejectModalReturn.customer}</strong>?
              Please specify the reason below.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                Rejection Reason (Customer will be notified)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Returned after the 14-day warranty policy / Items damaged by user..."
                className="w-full p-3 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-red-400 focus:outline-none min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalReturn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Process Customer Refund
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {refundModalReturn.id} • Order {refundModalReturn.orderNumber}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="font-bold text-gray-900 dark:text-white">{refundModalReturn.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Item:</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{refundModalReturn.item}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 dark:border-emerald-800/60 pt-1.5 font-bold text-sm">
                <span className="text-gray-900 dark:text-white">Total Refund Amount:</span>
                <span className="text-emerald-700 dark:text-emerald-300">${refundModalReturn.amount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This action will mark the return as <strong>REFUNDED</strong> and trigger the payment provider settlement for the original transaction.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalReturn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Return Case #{selectedReturn.id}
                </h3>
                <p className="text-xs text-gray-400">
                  Requested on {selectedReturn.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
              {/* Status & Amount Box */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200/80 dark:border-gray-700">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Status</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {selectedReturn.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Refund Value</span>
                  <span className="font-black text-base text-gray-900 dark:text-white">
                    ${selectedReturn.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer & Order */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Customer & Order
                </span>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white">{selectedReturn.customer}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedReturn.email} • {selectedReturn.phone}</p>
                  <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Order #{selectedReturn.orderNumber}</p>
                </div>
              </div>

              {/* Product & Reason */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Product & Return Reason
                </span>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white">{selectedReturn.item}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedReturn.reason}</p>
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
                  <p className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedReturn.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedReturn)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Approve Return</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalReturn(selectedReturn);
                        setRejectReason("");
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-800 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {selectedReturn.status === "APPROVED" && (
                  <button
                    onClick={() => setRefundModalReturn(selectedReturn)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
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
