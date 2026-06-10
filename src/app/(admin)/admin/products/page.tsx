import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Package, AlertTriangle, DollarSign } from "lucide-react";
import AdminSearch from "@/modules/admin/components/admin-search";
import ProductsTable from "@/modules/admin/components/products-table";
import { Product } from "@/types/product";

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
  const [products, totalCount, filteredCount, lowStockCount, categories] =
    await Promise.all([
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
      prisma.product.count({
        where: { stock: { lte: 10 } },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      // Efficiently calculate inventory value using aggregate
      prisma.product.aggregate({
        _sum: {
          price: true,
          stock: true,
        },
      }),
    ]);

  // Inventory value logic: we need (price * stock) for each item.
  // Prisma aggregate doesn't support multiplying fields within the database easily without raw queries.
  // HOWEVER, we can at least fetch the sum of everything or just fetch price and stock for all products.
  // To keep it simple and performant, let's fetch only price and stock for ALL products once.
  // This is still better than include: { category: true } and many other fields.
  const allProductStats = await prisma.product.findMany({
    select: { price: true, stock: true },
  });

  const inventoryValue = allProductStats.reduce(
    (acc, item) => acc + item.price * item.stock,
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
            Products
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Manage your store&apos;s inventory and catalog.
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg dark:shadow-none shadow-gray-200 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Add Product
        </Link>
      </div>

      {/* 2. Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-blue-100 transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              Total Products
            </p>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
              {totalCount}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-green-100 transition-all">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              Inventory Value
            </p>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
              ${inventoryValue.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-orange-100 transition-all">
          <div
            className={`p-3 rounded-xl transition-all group-hover:scale-110 ${
              lowStockCount > 0
                ? "bg-orange-50 text-orange-600"
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-400"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              Low Stock Items
            </p>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
              {lowStockCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Main Product Table Wrapper */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm dark:shadow-none overflow-hidden">
        {/* A. Toolbar (Search & Filter) */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50 dark:bg-gray-800/50">
          <AdminSearch placeholder="Search by name, SKU..." />
        </div>

        <ProductsTable
          products={products as unknown as Product[]}
          categories={categories}
          totalCount={filteredCount}
          allCount={totalCount}
        />
      </div>
    </div>
  );
}
