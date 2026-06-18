import { prisma } from "@/lib/prisma";
import { Product } from "@/types/product";
import ProductCatalog from "../components/product-catalog";
import { Prisma } from "@prisma/client";
import ProductFilters from "../components/product-filters";
import MobileFilters from "../components/mobile-filters";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProductViewProps {
  filters?: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
  showFilters?: boolean;
}

export default async function ProductView({
  filters = {},
  showFilters = true,
}: ProductViewProps) {
  const { q, category, brand, minPrice, maxPrice, sort } = filters;

  // Fetch unique categories and brands for filters
  const [categories, uniqueBrands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({
      select: { brand: true },
      distinct: ["brand"],
      where: { brand: { not: null } },
    }),
  ]);

  const brands = uniqueBrands.map((b: { brand: string | null }) => b.brand as string).filter(Boolean);

  // Build Prisma query where clause
  const where: Prisma.ProductWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      category ? { category: { name: category } } : {},
      brand ? { brand: brand } : {},
      minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
              ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
            },
          }
        : {},
      { isActive: true },
      {
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
    ],
  };

  // Build Prisma query orderBy
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };

  // Fetch filtered products
  let products: Product[] = [];

  if (q) {
    // Fuzzy matching with Postgres similarity
    // We use raw SQL to leverage pg_trgm similarity scores for ranking and typo tolerance.
    products = await prisma.$queryRaw<Product[]>(Prisma.sql`
      SELECT 
        p.*,
        c.id as "categoryId",
        c.name as "categoryName"
      FROM products p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE (
        similarity(p.name, ${q}) > 0.15
        OR p.name ILIKE ${"%" + q + "%"}
        OR p.description ILIKE ${"%" + q + "%"}
        OR p.sku ILIKE ${"%" + q + "%"}
      )
      AND p."isActive" = true
      AND (p."scheduledAt" IS NULL OR p."scheduledAt" <= NOW())
      ${category ? Prisma.sql`AND c.name = ${category}` : Prisma.empty}
      ${brand ? Prisma.sql`AND p.brand = ${brand}` : Prisma.empty}
      ${minPrice ? Prisma.sql`AND p.price >= ${parseFloat(minPrice)}` : Prisma.empty}
      ${maxPrice ? Prisma.sql`AND p.price <= ${parseFloat(maxPrice)}` : Prisma.empty}
      ORDER BY similarity(p.name, ${q}) DESC
      LIMIT 40
    `);
    
    type RawProductResult = Product & { categoryId?: string; categoryName?: string };

    // Manually attach category object if needed for the ProductCard
    products = (products as RawProductResult[]).map(p => ({
      ...p,
      category: p.categoryName ? { id: p.categoryId!, name: p.categoryName } : null
    })) as Product[];
    
  } else {
    products = (await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
      take: 40,
    })) as unknown as Product[];
  }

  return (
    <div className="bg-[#fcfcff] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* --- SIDEBAR: FILTERS (Desktop) --- */}
          {showFilters && (
            <>
              <aside className="hidden lg:block w-80 lg:sticky lg:top-24">
                <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-2xl shadow-gray-200/40">
                  <ProductFilters categories={categories} brands={brands} />
                </div>
              </aside>
              <MobileFilters categories={categories} brands={brands} />
            </>
          )}

          {/* --- MAIN CONTENT: GRID --- */}
          <main className={cn("flex-1 w-full", !showFilters && "mx-auto")}>
            {/* Grid */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-4 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <SlidersHorizontal size={40} className="text-gray-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">
                  Empty inventory
                </h3>
                <p className="text-gray-400 mt-2 max-w-xs font-medium px-4">
                  We couldn&apos;t find any products matching your specific
                  advanced filters.
                </p>
                <Link
                  href="/products"
                  className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200"
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <ProductCatalog products={products} showFilters={showFilters} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
