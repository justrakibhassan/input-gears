import { prisma } from "@/lib/prisma";
import ProductCard from "../../products/components/product-card";
import { Product } from "@/types/product";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default async function FeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-16 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]" />
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight uppercase">
                Featured <span className="text-indigo-600">Gears</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-400 font-bold ml-4.5 max-w-xl">
              Equip yourself with our most sought-after high-performance peripherals.
            </p>
          </div>

          <Link
            href="/products"
            className="group flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-gray-900 bg-gray-50 px-6 py-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            Explore Library
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} data={product as unknown as Product} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-12 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95"
          >
            <ShoppingBag size={18} />
            View Everything
          </Link>
        </div>
      </div>
    </section>
  );
}
