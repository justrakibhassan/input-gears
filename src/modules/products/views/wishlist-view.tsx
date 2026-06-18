"use client";

import { useWishlist } from "../hooks/use-wishlist";
import ProductCard from "../components/product-card";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";

export default function WishlistView() {
  const { items } = useWishlist();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Hydration fix
  const wishlistItems = isMounted ? items : [];

  return (
    <section className="py-12 sm:py-20 bg-gray-50/50 min-h-[70vh]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Heart size={24} fill="currentColor" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight uppercase">
                My <span className="text-indigo-600">Wishlist</span>
              </h1>
            </div>
            <p className="text-gray-500 font-medium max-w-lg">
              Save your favorite gadgets and gears here. Track availability and
              snag them when the time is right.
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-sm font-bold text-gray-900">
                {wishlistItems.length}
              </span>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest text-[10px]">
                Items Saved
              </span>
            </div>
          )}
        </div>

        {/* Wishlist Grid */}
        {!isMounted || wishlistItems.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-20 px-6 bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6">
              <Heart size={40} strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-10 font-medium">
              Looks like you haven&apos;t saved any gadgets yet. Explore our
              store and find the perfect gear for your setup!
            </p>
            <Link
              href="/products"
              className="flex items-center gap-2 px-8 py-4 bg-gray-950 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-gray-200 hover:shadow-indigo-100 group"
            >
              <ShoppingBag size={20} />
              Start Shopping
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product.id}
                data={product as unknown as Product}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
