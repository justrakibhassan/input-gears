"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description: string;
  variant?: "danger" | "warning" | "info";
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
  variant = "danger",
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const variantStyles = {
    danger: "bg-red-50 text-red-600 border-red-100 ring-red-50",
    warning: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-50",
    info: "bg-blue-50 text-blue-600 border-blue-100 ring-blue-50",
  };

  const confirmBtnStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-100",
    info: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
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
          <div className="fixed inset-0 flex items-center justify-center p-4 z-9999">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              {/* Decorative Background Icon */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                <AlertCircle size={160} />
              </div>

              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`p-4 rounded-2xl border ${variantStyles[variant]} ring-8 transition-all`}
                  >
                    <AlertCircle size={28} />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                  {title}
                </h2>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-10">
                  <button
                    disabled={loading}
                    onClick={onClose}
                    className="flex-1 px-6 py-4 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={loading}
                    onClick={onConfirm}
                    className={`flex-1 px-6 py-4 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${confirmBtnStyles[variant]}`}
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
