"use client";

import { X } from "lucide-react";
import ProductEditForm from "../views/product-edit-form";
import { Product } from "@/types/product";

interface ProductEditModalProps {
  product: Product | unknown; // Accept unknown for Prisma compatibility, cast in form
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductEditModal({
  product,
  isOpen,
  onClose,
}: ProductEditModalProps) {
  if (!isOpen || !product) return null;

  const productData = product as Product;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Edit Product</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Updating:{" "}
              <span className="font-semibold text-indigo-600">
                {productData.name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ProductEditForm
            product={product as unknown as Product}
            isModal={true}
            onSuccess={() => {
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
