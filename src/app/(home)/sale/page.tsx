import { prisma } from "@/lib/prisma";
import { Product } from "@/types/product";
import SaleClient from "@/modules/products/components/sale-client";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sale — Input Gears",
  description: "Shop our best deals on keyboards, mice, headsets and more. Limited time offers on premium gaming gear.",
};

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

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-14">
        <SaleClient products={products} />
      </div>
    </main>
  );
}
