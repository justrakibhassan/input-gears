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
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-white rounded-2xl sm:rounded-3xl border border-gray-150/90 shadow-2xs transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 overflow-hidden flex flex-row p-3 sm:p-4 gap-4 sm:gap-6 items-center"
    >
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={data}
      />

      {/* Image Container */}
      <div className="relative w-24 h-24 sm:w-44 sm:aspect-4/3 bg-gray-50/80 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0">
        <Link href={`/products/${data.slug}`} className="relative block w-full h-full">
          {data.image ? (
            <Image
              src={data.image}
              alt={data.name}
              fill
              className={`object-cover transition-transform duration-700 ease-out ${
                isOutOfStock ? "opacity-35 grayscale" : "group-hover:scale-105"
              }`}
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium italic">
              No Image
            </div>
          )}
        </Link>

        {/* Minimal Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {data.isOnSale && data.salePrice && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-900/85 backdrop-blur-md text-white shadow-2xs">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="flex-1 flex flex-col min-w-0 text-left">
        <div className="flex-1">
          {data.category && (
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 block line-clamp-1">
              {data.category.name}
            </span>
          )}

          <Link href={`/products/${data.slug}`} className="inline-block">
            <h3 className="font-bold text-gray-900 text-sm sm:text-lg group-hover:text-gray-700 transition-colors tracking-tight line-clamp-1">
              {data.name}
            </h3>
          </Link>
          
          <p className="hidden sm:block text-xs text-gray-500 font-medium mt-1 line-clamp-2 max-w-xl">
            {data.description || "Premium gadget for enthusiasts."}
          </p>

          {/* Key specs row */}
          {(data.brand || data.connectionType || data.switchType) && (
            <div className="hidden sm:flex flex-wrap justify-start gap-x-3.5 gap-y-1 mt-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
        <div className="flex flex-row items-center justify-between mt-2 pt-2.5 border-t border-gray-100 gap-2 w-full sm:mt-3 sm:pt-3">
          <div className="flex flex-col items-start">
            {data.isOnSale && data.salePrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-sm sm:text-xl text-rose-600 tabular-nums">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.salePrice)}
                </span>
                <span className="text-xs text-gray-400 line-through tabular-nums">
                  {formattedPrice}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-sm sm:text-xl text-gray-900 tabular-nums tracking-tight">
                {formattedPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Wishlist */}
            <button
              onClick={onToggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center border shadow-2xs backdrop-blur-md transition-all cursor-pointer ${
                isWishlisted
                  ? "bg-rose-50 text-rose-600 border-rose-200 shadow-rose-100/50"
                  : "bg-white text-gray-600 border-gray-200/80 hover:bg-white hover:text-rose-600 hover:border-rose-200"
              }`}
            >
              <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} />
            </button>

            {/* Compare */}
            <button
              onClick={onToggleCompare}
              aria-label={isComparing ? "Remove from compare" : "Add to compare"}
              className={`hidden sm:flex h-9 w-9 rounded-xl items-center justify-center border shadow-2xs backdrop-blur-md transition-all cursor-pointer ${
                isComparing
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200/80 hover:bg-white hover:text-gray-950 hover:border-gray-300"
              }`}
            >
              <ArrowLeftRight size={15} />
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
              className="hidden sm:flex h-9 w-9 bg-white text-gray-600 rounded-xl items-center justify-center border border-gray-200/80 hover:bg-white hover:text-gray-950 hover:border-gray-300 shadow-2xs transition-all cursor-pointer"
            >
              <Search size={15} />
            </button>

            {/* Add to Cart */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={`
                h-8 px-3 sm:h-9 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-2xs active:scale-95 z-10 shrink-0 cursor-pointer
                ${
                  isOutOfStock
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none border border-gray-200/60"
                    : isAdded
                      ? "bg-emerald-600 text-white shadow-emerald-200/60"
                      : "bg-gray-900 text-white hover:bg-black"
                }
              `}
            >
              {isAdded ? (
                <>
                  <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Add to Cart</span>
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
