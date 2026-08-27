"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, Heart, Search, ArrowLeftRight, Star } from "lucide-react";
import { useCart, CartItem } from "@/modules/cart/hooks/use-cart";
import { MouseEventHandler, useState, useEffect, memo, useMemo } from "react";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
import { QuickViewModal } from "./quick-view-modal";
import { Product } from "@/types/product";

interface ProductCardProps {
  data: Product;
}

const ProductCard = memo(({ data }: ProductCardProps) => {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { data: session } = useSession();

  const [isAdded, setIsAdded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Multi-image list for interactive hover scrub on PC
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (data.image) list.push(data.image);
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (data.specs && typeof data.specs === "object") {
      const rawMap = (data.specs as Record<string, unknown>).colorMap;
      if (rawMap && typeof rawMap === "object") {
        Object.values(rawMap as Record<string, { image?: string }>).forEach((val) => {
          if (val && val.image && !list.includes(val.image)) {
            list.push(val.image);
          }
        });
      }
    }
    return list;
  }, [data.image, data.images, data.specs]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const currentImage = allImages[activeImageIndex] || data.image || "";

  // Cursor move handler for interactive image preview on PC
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (allImages.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.min(
      allImages.length - 1,
      Math.max(0, Math.floor((x / rect.width) * allImages.length))
    );
    if (index !== activeImageIndex) {
      setActiveImageIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setActiveImageIndex(0);
  };

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(data.price);
  }, [data.price]);

  const formattedSalePrice = useMemo(() => {
    if (data.isOnSale && data.salePrice) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(data.salePrice);
    }
    return null;
  }, [data.isOnSale, data.salePrice]);

  const discountPercentage = useMemo(() => {
    if (data.isOnSale && data.salePrice && data.price > data.salePrice) {
      return Math.round(((data.price - data.salePrice) / data.price) * 100);
    }
    return null;
  }, [data.isOnSale, data.salePrice, data.price]);

  // Hydration fix
  const isWishlisted = isMounted ? wishlist.isInWishlist(data.id) : false;
  const isComparing = isMounted ? compare.isInCompare(data.id) : false;
  const isOutOfStock = data.stock === 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAdded) {
      timeout = setTimeout(() => setIsAdded(false), 1800);
    }
    return () => clearTimeout(timeout);
  }, [isAdded]);

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock) return;

    const cartItem: CartItem = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      price: data.isOnSale && data.salePrice ? data.salePrice : data.price,
      image: currentImage || data.image || "",
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
        price: data.isOnSale && data.salePrice ? data.salePrice : data.price,
        image: currentImage || data.image || "",
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
        price: data.isOnSale && data.salePrice ? data.salePrice : data.price,
        image: currentImage || data.image || "",
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
    <div className="group relative bg-transparent overflow-hidden flex flex-col h-full">
      <QuickViewModal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        product={data}
      />
      
      {/* Product Image Surface (Interactive MouseMove on PC, Clean Card with Bottom Pill) */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-square bg-[#fafafc] rounded-2xl sm:rounded-3xl overflow-hidden p-1 sm:p-1.5 flex items-center justify-center"
      >
        <Link href={`/products/${data.slug}`} className="relative block w-full h-full">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={data.name}
              fill
              className={`object-contain transition-opacity duration-200 ${
                isOutOfStock ? "opacity-35 grayscale" : "opacity-100"
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium italic">
              No Image
            </div>
          )}
        </Link>

        {/* Top-Left: Discount & Hot Badges */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-20 pointer-events-none">
          {discountPercentage ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold tracking-tight bg-[#65b045] text-white shadow-2xs">
              -{discountPercentage}%
            </span>
          ) : null}
          {isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider bg-gray-900 text-white shadow-2xs">
              Sold Out
            </span>
          )}
        </div>

        {/* Top-Right: Compare Button (PC only on hover) */}
        <div className="hidden md:block absolute top-2.5 right-2.5 z-20">
          <button
            onClick={onToggleCompare}
            aria-label={isComparing ? "Remove from compare" : "Add to compare"}
            title={isComparing ? "In Compare" : "Compare"}
            className={`group/btn relative h-9 w-9 rounded-full flex items-center justify-center border shadow-xs backdrop-blur-md transition-all cursor-pointer ${
              isComparing
                ? "bg-gray-900 text-white border-gray-900 shadow-gray-300"
                : "bg-white/95 text-gray-700 border-gray-200/90 hover:bg-white hover:text-gray-900 hover:border-gray-400 opacity-0 group-hover:opacity-100"
            }`}
          >
            <ArrowLeftRight size={16} strokeWidth={2} />
            <div className="absolute right-full mr-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
              {isComparing ? "In Compare" : "Compare"}
            </div>
          </button>
        </div>

        {/* 1. PC HOVER CAPSULE (3 Icons: Cart, Quick View, Wishlist - appears on PC hover) */}
        <div className="hidden md:block absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg shadow-gray-900/10 border border-gray-200/90 px-3.5 py-1.5 flex items-center gap-3.5">
            {/* Cart Button */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? "Out of stock" : isAdded ? "Product added" : "Add to cart"}
              title={isOutOfStock ? "Out of Stock" : isAdded ? "Added to Cart" : "Add to Cart"}
              className={`p-1 transition-transform hover:scale-115 active:scale-95 cursor-pointer ${
                isOutOfStock
                  ? "text-gray-300 cursor-not-allowed"
                  : isAdded
                    ? "text-emerald-600"
                    : "text-gray-700 hover:text-gray-950"
              }`}
            >
              {isAdded ? (
                <Check size={18} strokeWidth={2.8} className="animate-in zoom-in-50 duration-200" />
              ) : (
                <ShoppingCart size={18} strokeWidth={1.9} />
              )}
            </button>

            {/* Divider */}
            <div className="w-[1px] h-4 bg-gray-200" />

            {/* Quick View Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              aria-label="Quick view product"
              title="Quick View"
              className="p-1 text-gray-700 hover:text-gray-950 transition-transform hover:scale-115 active:scale-95 cursor-pointer"
            >
              <Search size={18} strokeWidth={1.9} />
            </button>

            {/* Divider */}
            <div className="w-[1px] h-4 bg-gray-200" />

            {/* Wishlist Button */}
            <button
              onClick={onToggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
              className={`p-1 transition-transform hover:scale-115 active:scale-95 cursor-pointer ${
                isWishlisted
                  ? "text-rose-600"
                  : "text-gray-700 hover:text-rose-600"
              }`}
            >
              <Heart
                size={18}
                strokeWidth={1.9}
                fill={isWishlisted ? "currentColor" : "none"}
                className={isWishlisted ? "text-rose-600 fill-rose-600" : ""}
              />
            </button>
          </div>
        </div>

        {/* 2. MOBILE CAPSULE (2 Icons ONLY: Cart & Wishlist - Matching Screenshot) */}
        <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full shadow-md border border-gray-200/90 px-3 py-1 flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              aria-label="Add to cart"
              className={`p-0.5 transition-transform active:scale-90 cursor-pointer ${
                isOutOfStock
                  ? "text-gray-300 cursor-not-allowed"
                  : isAdded
                    ? "text-emerald-600"
                    : "text-gray-700"
              }`}
            >
              {isAdded ? (
                <Check size={16} strokeWidth={2.8} />
              ) : (
                <ShoppingCart size={16} strokeWidth={1.8} />
              )}
            </button>

            {/* Divider */}
            <div className="w-[1px] h-3.5 bg-gray-200" />

            {/* Wishlist Button */}
            <button
              onClick={onToggleWishlist}
              aria-label="Wishlist"
              className={`p-0.5 transition-transform active:scale-90 cursor-pointer ${
                isWishlisted ? "text-rose-600" : "text-gray-700"
              }`}
            >
              <Heart
                size={16}
                strokeWidth={1.8}
                fill={isWishlisted ? "currentColor" : "none"}
                className={isWishlisted ? "text-rose-600 fill-rose-600" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Product Content Details (Borderless, Compact, Centered - Clean Readable Typography) */}
      <div className="pt-2 px-1 pb-1 flex flex-col items-center text-center flex-1">
        {/* Product Title */}
        <Link href={`/products/${data.slug}`} className="block w-full">
          <h3 className="font-bold text-gray-900 text-[13.5px] sm:text-[15px] line-clamp-1 tracking-tight">
            {data.name}
          </h3>
        </Link>

        {/* Category / Subtitle */}
        {data.category && (
          <p className="text-[12px] text-gray-400 font-medium line-clamp-1 mt-0.5">
            {data.category.name}
            {data.brand ? `, ${data.brand}` : ""}
          </p>
        )}

        {/* 5-Star Rating (Centered) */}
        <div className="flex items-center justify-center gap-0.5 my-1 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
          ))}
        </div>

        {/* Price Display (Centered - Clear Bold Dark Price) */}
        <div className="mt-auto flex items-baseline justify-center gap-2 flex-wrap">
          {data.isOnSale && formattedSalePrice ? (
            <>
              <span className="text-[12px] sm:text-[13px] text-gray-400 line-through tabular-nums font-normal">
                {formattedPrice}
              </span>
              <span className="font-extrabold text-[14.5px] sm:text-[16px] text-gray-900 tabular-nums tracking-tight">
                {formattedSalePrice}
              </span>
            </>
          ) : (
            <span className="font-extrabold text-[14.5px] sm:text-[16px] text-gray-900 tabular-nums tracking-tight">
              {formattedPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
