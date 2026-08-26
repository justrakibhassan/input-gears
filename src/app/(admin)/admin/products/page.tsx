import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Package, AlertTriangle, DollarSign, History } from "lucide-react";
import ProductsTable from "@/modules/admin/components/products-table";
import { Product } from "@/types/product";

export const metadata = {
  title: "Products Catalog — Admin",
};

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stock?: string;
    sort?: string;
    order?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const {
    q,
    category,
    stock,
    sort = "createdAt",
    order = "desc",
    page = "1",
    limit = "20",
  } = params;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 1. Construct Where Clause
  const where: import("@prisma/client").Prisma.ProductWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (stock) {
    if (stock === "in-stock") where.stock = { gt: 10 };
    if (stock === "low-stock") where.stock = { gt: 0, lte: 10 };
    if (stock === "out-of-stock") where.stock = 0;
  }

  // 2. Parallel Data Fetching
  const [
    products,
    totalCount,
    filteredCount,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    categories,
    allProductStats,
  ] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { [sort]: order },
      skip,
      take: limitNum,
    }),
    prisma.product.count(), // Total in store
    prisma.product.count({ where }), // Filtered count
    prisma.product.count({ where: { stock: { gt: 10 } } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { price: true, stock: true },
    }),
  ]);

  const inventoryValue = allProductStats.reduce(
    (acc, item) => acc + item.price * item.stock,
    0
  );

  const stockCounts = {
    all: totalCount,
    inStock: inStockCount,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Page Header with Title on Left & Summary Badges on Right (with icons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Product Catalog
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage product inventory, stock levels, categories, and pricing
            </p>
          </div>
        </div>

        {/* Right Side: Total Products, Inventory Value, Low Stock Badges & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Package size={14} className="text-gray-400" />
            <span className="text-gray-400 font-medium">Products:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {totalCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Inventory:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              ${inventoryValue.toLocaleString()}
            </span>
          </div>

          {lowStockCount > 0 && (
            <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">Low Stock:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {lowStockCount}
              </span>
            </div>
          )}

          <Link
            href="/admin/inventory/history"
            className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs active:scale-95"
            title="View Stock History"
          >
            <History size={14} className="text-gray-500" />
            <span>Stock History</span>
          </Link>

          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Product Table Wrapper */}
      <ProductsTable
        products={products as unknown as Product[]}
        categories={categories}
        totalCount={filteredCount}
        allCount={totalCount}
        stockCounts={stockCounts}
      />
    </div>
  );
}
