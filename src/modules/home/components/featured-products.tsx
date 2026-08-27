import { prisma } from "@/lib/prisma";
import ProductCard from "../../products/components/product-card";
import { Product } from "@/types/product";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function FeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Clean Basic Dark Typography */}
        <div className="flex items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-gray-100 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Featured Gears
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
              Explore our top-selling and high-performance peripherals
            </p>
          </div>

          <Link
            href="/products"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Product Grid - 2 on mobile, 5 on PC */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} data={product as unknown as Product} />
          ))}
        </div>
      </div>
    </section>
  );
}
