"use client";

import { useState, useEffect, memo } from "react";
import { LayoutGrid, Grid3X3, List, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";
import ProductCard from "./product-card";
import ProductRowCard from "./product-row-card";
import ProductTableView from "./product-table-view";

interface ProductCatalogProps {
  products: Product[];
  showFilters?: boolean;
}

type ViewMode = "grid" | "compact-grid" | "list" | "table";

const ProductCatalog = memo(({ products, showFilters = true }: ProductCatalogProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedMode = localStorage.getItem("input-gears-view-mode");
    if (savedMode && ["grid", "compact-grid", "list", "table"].includes(savedMode)) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setViewMode(savedMode === "compact-grid" || savedMode === "grid" ? "grid" : "list");
      } else {
        setViewMode(savedMode as ViewMode);
      }
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("input-gears-view-mode", mode);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-gray-100/80 shadow-sm">
        <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider pl-1">
          Catalog View: <span className="text-gray-900 font-extrabold">{products.length} Gears</span>
        </p>

        {/* View Mode Selectors */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl w-full sm:w-auto">
          {/* Grid View (Standard) */}
          <button
            onClick={() => handleViewModeChange("grid")}
            className={cn(
              "flex-1 sm:flex-none h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300",
              viewMode === "grid"
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
              "hidden sm:flex flex-1 sm:flex-none h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider items-center justify-center gap-1.5 transition-all duration-300",
              viewMode === "compact-grid"
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
              "flex-1 sm:flex-none h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300",
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
            )}
            title="List View"
          >
            <List size={14} />
            <span className="hidden sm:inline">List</span>
          </button>

          {/* Table View */}
          <button
            onClick={() => handleViewModeChange("table")}
            className={cn(
              "hidden sm:flex flex-1 sm:flex-none h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider items-center justify-center gap-1.5 transition-all duration-300",
              viewMode === "table"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
            )}
            title="Table View"
          >
            <TableProperties size={14} />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Dynamic Products Display */}
      {viewMode === "grid" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-5 sm:gap-6 lg:gap-8",
            showFilters
              ? "lg:grid-cols-2 xl:grid-cols-3 mini:grid-cols-3"
              : "lg:grid-cols-3 xl:grid-cols-4 mini:grid-cols-4",
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {viewMode === "compact-grid" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-4",
            showFilters
              ? "md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 mini:grid-cols-4"
              : "md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 mini:grid-cols-5",
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex flex-col gap-5">
          {products.map((product) => (
            <ProductRowCard key={product.id} data={product} />
          ))}
        </div>
      )}

      {viewMode === "table" && (
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
