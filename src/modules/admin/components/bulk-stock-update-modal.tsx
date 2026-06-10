"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Loader2, Save, X, AlertCircle } from "lucide-react";
import { updateStockBulk } from "@/modules/admin/actions";
import { toast } from "sonner";
import Image from "next/image";
import { Product } from "@/types/product";

interface BulkStockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onSuccess?: () => void;
}

export default function BulkStockUpdateModal({
  isOpen,
  onClose,
  selectedProducts,
  onSuccess,
}: BulkStockUpdateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    selectedProducts.forEach((p) => {
      initial[p.id] = p.stock;
    });
    return initial;
  });
  const [reason, setReason] = useState("Manual Bulk Update");

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value);
    setStockUpdates((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSave = () => {
    const updates = Object.entries(stockUpdates).map(([id, stock]) => ({
      id,
      stock,
    }));

    startTransition(async () => {
      const res = await updateStockBulk(updates, reason);
      if (res.success) {
        toast.success(res.message);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-9998"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-9999 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl relative pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 bg-gray-900 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] rotate-12">
                  <Box size={160} />
                </div>
                
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                      <Box size={24} className="text-indigo-400" />
                      Bulk Stock Update
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                      Review and adjust inventory for {selectedProducts.length} items
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-white/50 hover:text-white hover:bg-white dark:bg-gray-900/10 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 group transition-all hover:border-indigo-100"
                    >
                      <div className="h-14 w-14 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden relative shrink-0 shadow-sm dark:shadow-none">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Box size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Current: <span className="text-gray-900 dark:text-white">{product.stock}</span>
                          </span>
                          {product.stock < 5 && (
                            <span className="flex items-center gap-0.5 text-[8px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                              <AlertCircle size={8} /> Low Stock
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          value={stockUpdates[product.id] ?? product.stock}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                          className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center font-black text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Reason for Adjustment
                  </label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Monthly Inventory Sync, Damage Audit"
                    className="w-full h-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 font-bold text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  disabled={isPending}
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm dark:shadow-none"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  onClick={handleSave}
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg dark:shadow-none flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Update Inventory
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
