"use client";

import { useState, memo, useSyncExternalStore } from "react";
import {
  LayoutGrid,
  Grid3X3,
  List,
  TableProperties,
  ArrowUpDown,
  X,
  RotateCcw,
} from "lucide-react";
import { useQueryState, useQueryStates, parseAsString, parseAsFloat } from "nuqs";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";
import ProductCard from "./product-card";
import ProductRowCard from "./product-row-card";
import ProductTableView from "./product-table-view";

const emptySubscribe = () => () => {};

interface ProductCatalogProps {
  products: Product[];
  showFilters?: boolean;
}

type ViewMode = "grid" | "compact-grid" | "list" | "table";

const getInitialViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  try {
    const savedMode = localStorage.getItem("input-gears-view-mode");
    if (savedMode && ["grid", "compact-grid", "list", "table"].includes(savedMode)) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        return savedMode === "compact-grid" || savedMode === "grid" ? "grid" : "list";
      }
      return savedMode as ViewMode;
    }
  } catch {
    // ignore localStorage access error in restrictive environments
  }
  return "grid";
};

const ProductCatalog = memo(({ products, showFilters = true }: ProductCatalogProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdminLike = Boolean(
    userRole && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(userRole)
  );

  // nuqs query state bindings
  const [q, setQ] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false, throttleMs: 500 })
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );
  const [brand, setBrand] = useQueryState(
    "brand",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );
  const [priceQuery, setPriceQuery] = useQueryStates(
    {
      minPrice: parseAsFloat,
      maxPrice: parseAsFloat,
    },
    { shallow: false }
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("newest").withOptions({ shallow: false })
  );

  const effectiveViewMode = !isAdminLike && viewMode === "table" ? "grid" : viewMode;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("input-gears-view-mode", mode);
  };

  const hasActiveFilters = Boolean(
    q ||
    category ||
    brand ||
    priceQuery.minPrice != null ||
    priceQuery.maxPrice != null ||
    (sort && sort !== "newest")
  );

  const handleClearAll = () => {
    setQ("");
    setCategory("");
    setBrand("");
    setPriceQuery({ minPrice: null, maxPrice: null });
    setSort("newest");
  };

  // Render loading skeleton or default grid before mounting on client to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-5 sm:gap-6 lg:gap-8 animate-pulse",
          showFilters
            ? "lg:grid-cols-2 xl:grid-cols-3 mini:grid-cols-3"
            : "lg:grid-cols-3 xl:grid-cols-4 mini:grid-cols-4",
        )}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-100 rounded-3xl aspect-4/5 w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Catalog Control Toolbar */}
      <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-gray-100/80 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Result Count (clean, non-jargon) */}
          <div className="flex items-center gap-2 pl-1">
            <p className="text-xs sm:text-sm font-semibold text-gray-600">
              Showing <span className="text-gray-950 font-extrabold">{products.length}</span>{" "}
              {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="catalog-sort"
                className="text-xs font-semibold text-gray-500 hidden sm:inline whitespace-nowrap"
              >
                Sort:
              </label>
              <div className="relative">
                <select
                  id="catalog-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-gray-50/80 hover:bg-gray-100/90 text-gray-900 text-xs font-bold pl-3 pr-8 py-2 rounded-xl border border-gray-200/80 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <ArrowUpDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* View Mode Selectors */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl">
              {/* Grid View (Standard) */}
              <button
                onClick={() => handleViewModeChange("grid")}
                className={cn(
                  "h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer",
                  effectiveViewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
                )}
                title="Grid View (Standard)"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>

              {/* Grid View (Compact) */}
              <button
                onClick={() => handleViewModeChange("compact-grid")}
                className={cn(
                  "hidden sm:flex h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer",
                  effectiveViewMode === "compact-grid"
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
                )}
                title="Grid View (Compact)"
              >
                <Grid3X3 size={14} />
                <span className="hidden sm:inline">Compact</span>
              </button>

              {/* List View */}
              <button
                onClick={() => handleViewModeChange("list")}
                className={cn(
                  "h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer",
                  effectiveViewMode === "list"
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
                )}
                title="List View"
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </button>

              {/* Table View (Admin Only) */}
              {isAdminLike && (
                <button
                  onClick={() => handleViewModeChange("table")}
                  className={cn(
                    "hidden sm:flex h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer",
                    effectiveViewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                      : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
                  )}
                  title="Table View (Admin)"
                >
                  <TableProperties size={14} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips + Clear All */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100/90 text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Filters:
            </span>

            {q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200/70">
                <span>&ldquo;{q}&rdquo;</span>
                <button
                  onClick={() => setQ("")}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span>{category}</span>
                <button
                  onClick={() => setCategory("")}
                  className="text-indigo-400 hover:text-indigo-700 transition-colors p-0.5 rounded-full hover:bg-indigo-100 cursor-pointer"
                  aria-label="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {brand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200/70">
                <span>{brand}</span>
                <button
                  onClick={() => setBrand("")}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                  aria-label="Remove brand filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(priceQuery.minPrice != null || priceQuery.maxPrice != null) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200/70">
                <span>
                  ${priceQuery.minPrice ?? 0} - {priceQuery.maxPrice ? `$${priceQuery.maxPrice}` : "$2000+"}
                </span>
                <button
                  onClick={() => setPriceQuery({ minPrice: null, maxPrice: null })}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                  aria-label="Remove price filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {sort && sort !== "newest" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200/70">
                <span>
                  {sort === "price_asc"
                    ? "Price: Low to High"
                    : sort === "price_desc"
                      ? "Price: High to Low"
                      : "Highest Rated"}
                </span>
                <button
                  onClick={() => setSort("newest")}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                  aria-label="Reset sort"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1 transition-colors flex items-center gap-1 cursor-pointer ml-auto sm:ml-0"
            >
              <RotateCcw size={11} />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Products Display */}
      {effectiveViewMode === "grid" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5",
            showFilters
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {effectiveViewMode === "compact-grid" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:gap-3.5 lg:gap-4",
            showFilters
              ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {effectiveViewMode === "list" && (
        <div className="flex flex-col gap-5">
          {products.map((product) => (
            <ProductRowCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {effectiveViewMode === "table" && isAdminLike && (
        <div className="w-full">
          {/* Fallback to simple list view on extra small screens as table doesn't fit */}
          <div className="block md:hidden space-y-4">
            {products.map((product) => (
              <ProductRowCard key={product.id} data={product} />
            ))}
          </div>
          <div className="hidden md:block">
            <ProductTableView products={products} />
          </div>
        </div>
      )}
    </div>
  );
});

ProductCatalog.displayName = "ProductCatalog";

export default ProductCatalog;
