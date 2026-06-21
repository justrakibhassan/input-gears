"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, Heart, Search, ArrowLeftRight } from "lucide-react";
import { useCart, CartItem } from "@/modules/cart/hooks/use-cart";
import { motion } from "framer-motion";
import { MouseEventHandler, useState, useEffect, memo, useMemo } from "react";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
import { QuickViewModal } from "./quick-view-modal";
import { Product } from "@/types/product";

interface ProductRowCardProps {
  data: Product;
}

const ProductRowCard = memo(({ data }: ProductRowCardProps) => {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { data: session } = useSession();

  const [isAdded, setIsAdded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(data.price);
  }, [data.price]);

  const isWishlisted = isMounted ? wishlist.isInWishlist(data.id) : false;
  const isComparing = isMounted ? compare.isInCompare(data.id) : false;
  const isOutOfStock = data.stock === 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAdded) {
      timeout = setTimeout(() => setIsAdded(false), 1500);
    }
    return () => clearTimeout(timeout);
  }, [isAdded]);

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const cartItem: CartItem = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      price: data.price,
      image: data.image || "",
      quantity: 1,
      maxStock: data.stock,
    };

    cart.addItem(cartItem, !!session);
    setIsAdded(true);
  };

  const onToggleWishlist: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    wishlist.toggleItem(
      {
        id: data.id,
        name: data.name,
        slug: data.slug,
        price: data.price,
        image: data.image || "",
        stock: data.stock,
        category: data.category ? { name: data.category.name } : null,
      },
      !!session,
    );
  };

  const onToggleCompare: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isComparing) {
      compare.removeItem(data.id);
    } else {
      compare.addItem({
        id: data.id,
        name: data.name,
        slug: data.slug,
        price: data.price,
        image: data.image || "",
        category: data.category,
        colors: data.colors,
        switchType: data.switchType || undefined,
        specs: data.specs,
        brand: data.brand,
        sku: data.sku,
        dpi: data.dpi,
        weight: data.weight,
        connectionType: data.connectionType,
        pollingRate: data.pollingRate,
        sensor: data.sensor,
        warranty: data.warranty,
        availability: data.availability,
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 md:hover:shadow-[0_15px_35px_rgba(79,70,229,0.08)] md:hover:border-indigo-100 overflow-hidden flex flex-row p-3 sm:p-4 gap-4 sm:gap-6 items-center"
    >
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={{
          id: data.id,
          name: data.name,
          price: data.price,
          image: data.image,
          description: data.description,
          stock: data.stock,
          slug: data.slug,
          category: data.category,
          brand: data.brand || null,
          switchType: data.switchType,
        }}
      />

      {/* Image */}
      <div className="relative w-24 h-24 sm:w-48 sm:aspect-4/3 bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0">
        <Link href={`/products/${data.slug}`} className="relative block w-full h-full">
          {data.image ? (
            <Image
              src={data.image}
              alt={data.name}
              fill
              className={`object-cover transition-transform duration-700 ${
                isOutOfStock ? "opacity-45 grayscale" : "md:group-hover:scale-105"
              }`}
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium italic">
              No Image
            </div>
          )}
        </Link>

        {/* Category Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {data.category && (
            <div className="bg-gray-900/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shadow-sm">
              {data.category.name}
            </div>
          )}
          {isOutOfStock && (
            <div className="bg-red-500/95 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shadow-md">
              Sold Out
            </div>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="flex-1 flex flex-col min-w-0 text-left">
        <div className="flex-1">
          <Link href={`/products/${data.slug}`} className="inline-block">
            <h3 className="font-bold text-gray-900 text-sm sm:text-xl group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
              {data.name}
            </h3>
          </Link>
          
          <p className="hidden sm:block text-xs sm:text-sm text-gray-500 font-medium mt-1.5 sm:mt-2 line-clamp-2 max-w-xl">
            {data.description || "Premium gadget for enthusiasts."}
          </p>

          {/* Key specs row */}
          {(data.brand || data.connectionType || data.switchType) && (
            <div className="hidden sm:flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-3 sm:mt-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {data.brand && (
                <span>
                  Brand: <span className="text-gray-700">{data.brand}</span>
                </span>
              )}
              {data.connectionType && (
                <span>
                  Conn: <span className="text-gray-700">{data.connectionType}</span>
                </span>
              )}
              {data.switchType && (
                <span>
                  Switch: <span className="text-gray-700">{data.switchType}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100 gap-2 w-full sm:mt-4 sm:pt-4">
          <div className="flex flex-col items-start">
            <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
              Price
            </span>
            <span className="font-black text-sm sm:text-2xl text-indigo-600 tabular-nums">
              {formattedPrice}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Wishlist */}
            <button
              onClick={onToggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 backdrop-blur-md transition-all ${
                isWishlisted
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-900 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
              }`}
            >
              <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} className="sm:w-[16px] sm:h-[16px]" />
            </button>

            {/* Compare */}
            <button
              onClick={onToggleCompare}
              aria-label={isComparing ? "Remove from compare" : "Add to compare"}
              className={`hidden sm:flex h-10 w-10 rounded-2xl items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 backdrop-blur-md transition-all ${
                isComparing
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-900 hover:bg-amber-500 hover:text-white hover:border-amber-500"
              }`}
            >
              <ArrowLeftRight size={16} />
            </button>

            {/* Quick View */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              aria-label="Quick view product"
              className="hidden sm:flex h-10 w-10 bg-white text-gray-900 rounded-2xl items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-pointer"
            >
              <Search size={16} />
            </button>

            {/* Add to Cart */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={`
                h-8 w-8 sm:h-10 sm:w-auto sm:px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95 z-10 shrink-0
                ${
                  isOutOfStock
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed shadow-none border border-gray-100"
                    : isAdded
                      ? "bg-emerald-500 text-white shadow-emerald-200"
                      : "bg-gray-950 text-white shadow-gray-200 hover:bg-indigo-600 hover:shadow-indigo-100"
                }
              `}
            >
              {isAdded ? (
                <>
                  <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-500" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} strokeWidth={2} className="transition-transform" />
                  <span className="hidden sm:inline">Buy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductRowCard.displayName = "ProductRowCard";

export default ProductRowCard;
