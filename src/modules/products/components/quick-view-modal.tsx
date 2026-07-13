"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Plus, Minus, Star, Zap } from "lucide-react";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { createPortal } from "react-dom";
import { getReviewStats } from "../../reviews/actions";

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    description: string | null;
    stock: number;
    slug: string;
    category?: {
      name: string;
    } | null;
    brand?: string | null;
    switchType?: string | null;
  };
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const cart = useCart();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (isOpen && product.id) {
      getReviewStats(product.id).then((res) => {
        if (res.success && res.data) {
          setRating(res.data.averageRating || 0);
          setReviewCount(res.data.totalReviews || 0);
        }
      });
    }
  }, [isOpen, product.id]);

  // Close on ESC and manage body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      cart.addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image || "",
          quantity: quantity,
          maxStock: product.stock,
        },
        !!session,
      );
      setIsAdding(false);
      onClose();
    }, 500);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-1200 flex items-center justify-center p-4 sm:p-8 overflow-y-auto no-scrollbar">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-950/20 backdrop-blur-xl cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2),0_0_20px_rgba(99,102,241,0.1)] overflow-hidden flex flex-col md:flex-row my-auto z-10 max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible no-scrollbar border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-2.5 rounded-full bg-white/80 backdrop-blur-md md:bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white transition-all active:scale-90 shadow-sm border border-gray-100"
            >
              <X size={18} className="md:w-5 md:h-5" />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-gray-50/50 p-6 md:p-8 flex items-center justify-center min-h-[220px] md:min-h-[500px]">
              <div className="relative w-full aspect-square max-w-[400px]">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4 drop-shadow-2xl"
                  />
                ) : (
                  <div className="text-gray-300 italic">No Image</div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-full uppercase tracking-widest">
                      {product.brand || "Premium Gear"}
                    </span>
                    {product.switchType && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Zap size={10} fill="currentColor" />{" "}
                        {product.switchType}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-indigo-600">
                      {formattedPrice}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star size={14} fill={reviewCount > 0 ? "currentColor" : "none"} className={reviewCount > 0 ? "text-yellow-400" : "text-gray-300"} />
                      <span className="text-sm font-bold text-gray-900">
                        {reviewCount > 0 ? rating.toFixed(1) : "New"}
                      </span>
                      {reviewCount > 0 && (
                        <span className="text-xs text-gray-500 font-semibold">
                          ({reviewCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
                  {product.description ||
                    "Designed for enthusiasts who demand performance and style. Experience premium tactile feedback and unmatched durability."}
                </p>

                <div className="pt-6 space-y-6">
                  {/* Quantity & Add to Cart */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center p-0.5 border border-gray-100 rounded-2xl bg-gray-50/80 shrink-0">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-500 transition disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" strokeWidth={3} />
                      </button>
                      <span className="w-8 md:w-10 text-center font-black text-gray-900 text-sm md:text-base">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity((q) => Math.min(product.stock, q + 1))
                        }
                        disabled={quantity >= product.stock}
                        aria-label="Increase quantity"
                        className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-500 transition disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" strokeWidth={3} />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={isAdding || product.stock === 0}
                      className="flex-1 bg-gray-900 text-white h-[48px] md:h-[52px] rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:bg-gray-200 disabled:cursor-not-allowed shadow-xl shadow-gray-200/50"
                    >
                      <ShoppingCart className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                      {product.stock === 0
                        ? "Sold Out"
                        : isAdding
                          ? "Processing..."
                          : "Add to Cart"}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      Category:{" "}
                      <span className="text-gray-900">
                        {product.category?.name || "Gears"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
