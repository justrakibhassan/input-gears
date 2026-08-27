"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "../types";
import { Star, ArrowRight } from "lucide-react";

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">Related Products</h3>
        <Link
          href="/products"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
        >
          View All
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="space-y-5">
        {products.map((product) => {
          const effectivePrice =
            product.isOnSale && product.salePrice
              ? product.salePrice
              : product.price;

          const formattedPrice = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(effectivePrice);

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 border border-transparent hover:border-gray-200"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-150/80">
                <Image
                  src={
                    product.images?.[0] || product.image || "/placeholder.png"
                  }
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="80px"
                />
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {product.category?.name || "General"}
                </span>
                <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors tracking-tight">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {formattedPrice}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <Star size={10} fill="currentColor" />
                    <span className="text-[10px] font-bold text-gray-400 ml-0.5">
                      4.8
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Modern Ad/Promo Card */}
      <div className="relative mt-8 p-6 rounded-2xl bg-linear-to-br from-indigo-600 to-violet-700 overflow-hidden shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <h4 className="text-lg font-bold text-white mb-2">Need Help?</h4>
          <p className="text-indigo-100 text-xs leading-relaxed mb-4">
            Our technical experts are ready to help you choose the best gear for
            your setup.
          </p>
          <Link
            href="/contact"
            className="block text-center w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-black shadow-lg hover:bg-indigo-50 transition-colors active:scale-95"
          >
            CHAT WITH EXPERT
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;
