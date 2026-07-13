import { prisma } from "@/lib/prisma";
import { Product } from "@/types/product";
import ProductCatalog from "@/modules/products/components/product-catalog";
import { Tag, Zap, Clock } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sale — Input Gears",
  description: "Shop our best deals on keyboards, mice, headsets and more. Limited time offers on premium gaming gear.",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function discountPercent(original: number, sale: number) {
  return Math.round(((original - sale) / original) * 100);
}

export default async function SalePage() {
  const now = new Date();

  const saleProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isOnSale: true,
      AND: [
        { OR: [{ saleEndDate: null }, { saleEndDate: { gte: now } }] },
        { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
      ],
    },
    include: { category: true },
    orderBy: [
      { salePrice: "asc" },
      { updatedAt: "desc" },
    ],
  });

  const products = saleProducts as unknown as Product[];

  const totalSavings = products.reduce((acc, p) => {
    if (p.salePrice) return acc + (p.price - p.salePrice);
    return acc;
  }, 0);

  const avgDiscount =
    products.filter(p => p.salePrice).length > 0
      ? Math.round(
          products
            .filter(p => p.salePrice)
            .reduce((acc, p) => acc + discountPercent(p.price, p.salePrice!), 0) /
            products.filter(p => p.salePrice).length
        )
      : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 text-white">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl translate-y-1/2" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Badge */}
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 backdrop-blur-sm text-red-300 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
              <Zap size={12} fill="currentColor" />
              Limited Time Offers
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              <span className="text-white">SALE</span>
              <span className="text-red-400"> DEALS</span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl max-w-2xl font-medium">
              Score premium gaming gear at unbeatable prices. Deals are updated regularly — grab yours before they&apos;re gone.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                <Tag size={18} className="text-red-400" />
                <div className="text-left">
                  <p className="text-2xl font-black text-white">{products.length}</p>
                  <p className="text-xs text-gray-400 font-medium">Products on sale</p>
                </div>
              </div>
              {totalSavings > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                  <Zap size={18} className="text-orange-400" fill="currentColor" />
                  <div className="text-left">
                    <p className="text-2xl font-black text-white">{formatPrice(totalSavings)}</p>
                    <p className="text-xs text-gray-400 font-medium">Total savings available</p>
                  </div>
                </div>
              )}
              {avgDiscount > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                  <Clock size={18} className="text-yellow-400" />
                  <div className="text-left">
                    <p className="text-2xl font-black text-white">Up to {avgDiscount}%</p>
                    <p className="text-xs text-gray-400 font-medium">Average discount</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-14">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <Tag size={64} className="mx-auto mb-6 text-gray-200" />
            <h2 className="text-2xl font-black text-gray-400 mb-2">No Active Sales Right Now</h2>
            <p className="text-gray-400 text-base">Check back soon — new deals are added regularly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">All Sale Items</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">{products.length} deals available</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-500 font-bold bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                <Zap size={14} fill="currentColor" />
                Best deals first
              </div>
            </div>
            <ProductCatalog
              products={products}
              showFilters={false}
            />
          </>
        )}
      </section>
    </main>
  );
}
