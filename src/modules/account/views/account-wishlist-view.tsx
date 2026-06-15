"use client";

import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import ProductCard from "@/modules/products/components/product-card";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";

export default function AccountWishlistView() {
  const { items } = useWishlist();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Hydration fix
  const wishlistItems = isMounted ? items : [];

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-150 mb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              My <span className="text-indigo-600">Wishlist</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-lg">
            Save your favorite gadgets and gears here. Track availability and
            snag them when the time is right.
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-xs self-start md:self-auto shrink-0">
            <span className="text-xs font-black text-gray-900">
              {wishlistItems.length}
            </span>
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">
              Items Saved
            </span>
          </div>
        )}
      </div>

      {/* Wishlist Grid */}
      {!isMounted || wishlistItems.length === 0 ? (
        <div className="max-w-xl mx-auto text-center py-16 px-6 flex flex-col items-center">
          <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
            <Heart size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 uppercase">
            Your wishlist is empty
          </h2>
          <p className="text-sm text-gray-500 mb-8 font-medium max-w-sm">
            Looks like you haven&apos;t saved any gadgets yet. Explore our
            store and find the perfect gear for your setup!
          </p>
          <Link
            href="/products"
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-gray-200 hover:shadow-indigo-100 group text-sm"
          >
            <ShoppingBag size={18} />
            Start Shopping
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((product) => (
            <ProductCard
              key={product.id}
              data={product as unknown as Product}
            />
          ))}
        </div>
      )}
    </div>
  );
}
