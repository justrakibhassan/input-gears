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

  // Hydration fix
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
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-500 md:hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] md:hover:border-indigo-200/50 overflow-hidden flex flex-col h-full active:scale-[0.98]"
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
          switchType: data.switchType
        }}
      />
      <div className="relative block aspect-4/5 bg-gray-50 overflow-hidden">
        <Link href={`/products/${data.slug}`} className="block w-full h-full">
          {data.image ? (
            <Image
              src={data.image}
              alt={data.name}
              fill
              className={`object-cover transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                isOutOfStock
                  ? "opacity-40 grayscale"
                  : "md:group-hover:scale-110"
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium italic">
              No Image
            </div>
          )}
        </Link>

        {/* Floating Actions - Static on Mobile, Hover on Desktop */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 transform transition-all duration-500 delay-75 md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 z-20">
          <button
            onClick={onToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`group/btn relative h-10 w-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all ${
              isWishlisted
                ? "bg-indigo-600 text-white"
                : "bg-white/90 text-gray-900 hover:bg-indigo-600 hover:text-white"
            }`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Wishlist
            </div>
          </button>

          <button
            onClick={onToggleCompare}
            aria-label={isComparing ? "Remove from compare" : "Add to compare"}
            className={`group/btn relative h-10 w-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all ${
              isComparing
                ? "bg-amber-500 text-white"
                : "bg-white/90 text-gray-900 hover:bg-amber-500 hover:text-white"
            }`}
          >
            <ArrowLeftRight size={18} />
            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Compare
            </div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
            aria-label="Quick view product"
            className="group/btn relative h-10 w-10 bg-white/90 backdrop-blur-md text-gray-900 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
          >
            <Search size={18} />
            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Quick View
            </div>
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {data.category && (
            <div className="bg-gray-900/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
              {data.category.name}
            </div>
          )}
          {isOutOfStock && (
            <div className="bg-red-500/95 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-pulse">
              Sold Out
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1">
        <div className="grow mb-3 sm:mb-4">
          <Link href={`/products/${data.slug}`} className="block">
            <h3 className="font-bold text-gray-900 text-sm sm:text-lg group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
              {data.name}
            </h3>
          </Link>
          <p className="text-[10px] sm:text-sm text-gray-600 line-clamp-2 mt-1 sm:mt-1.5 leading-relaxed font-medium">
            {data.description || "Premium gadget for enthusiasts."}
          </p>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">
              Price
            </span>
            <span className="font-black text-base sm:text-xl text-indigo-600 tabular-nums">
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? "Out of stock" : isAdded ? "Product added" : "Add to cart"}
            className={`
                relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm active:scale-90 overflow-hidden z-10
                ${
                  isOutOfStock
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed shadow-none border border-gray-100"
                    : isAdded
                      ? "bg-emerald-500 text-white shadow-emerald-200"
                      : "bg-gray-950 text-white shadow-gray-200 hover:bg-indigo-600 hover:shadow-indigo-100 group-hover:-translate-y-1"
                }
            `}
          >
            {isAdded ? (
              <Check
                size={18}
                strokeWidth={3}
                className="animate-in zoom-in duration-500"
              />
            ) : (
              <ShoppingCart
                size={18}
                strokeWidth={2}
                className="group-hover:rotate-[-10deg] transition-transform"
              />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
