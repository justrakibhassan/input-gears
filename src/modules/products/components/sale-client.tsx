"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types/product";
import ProductCatalog from "./product-catalog";
import { Tag, Search, ChevronDown } from "lucide-react";

interface SaleClientProps {
  products: Product[];
}

function discountPercent(original: number, sale: number) {
  return Math.round(((original - sale) / original) * 100);
}

export default function SaleClient({ products }: SaleClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("discount");


  // Extract unique categories represented in the sale products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      if (p.category?.name) {
        counts[p.category.name] = (counts[p.category.name] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category?.name === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "discount") {
        const discA = a.salePrice ? discountPercent(a.price, a.salePrice) : 0;
        const discB = b.salePrice ? discountPercent(b.price, b.salePrice) : 0;
        return discB - discA;
      }
      if (sortBy === "price_asc") {
        return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      }
      if (sortBy === "price_desc") {
        return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      }
      if (sortBy === "newest") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);



  return (
    <div className="space-y-12 pb-20">

      {/* Main Browse Section */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          {/* Category Tabs */}
          {categories.length > 2 ? (
            <div className="flex overflow-x-auto gap-1.5 pb-1 lg:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {cat} <span className="ml-1 text-[9px] opacity-70">({categoryCounts[cat] || 0})</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 font-bold">
              {filteredAndSortedProducts.length} active deals
            </div>
          )}

          {/* Interactive controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-4.5 pr-9 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-gray-700 cursor-pointer"
              >
                <option value="discount">Biggest Discount %</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Added</option>
              </select>
              <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>


        {/* Catalog list / grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-black text-gray-500 uppercase">No Matches Found</h3>
            <p className="text-gray-400 text-sm mt-1">Try tweaking your search query or choosing another category.</p>
          </div>
        ) : (
          <ProductCatalog products={filteredAndSortedProducts} showFilters={false} />
        )}
      </section>
    </div>
  );
}
