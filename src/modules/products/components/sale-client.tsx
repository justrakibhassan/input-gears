"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import ProductCatalog from "./product-catalog";
import { Tag, Zap, Clock, Search, ChevronDown, Flame, ShoppingCart, Percent } from "lucide-react";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

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
  const cart = useCart();
  const { data: session } = useSession();

  // Find the spotlight product (the active sale product with the highest discount percentage)
  const spotlightProduct = useMemo(() => {
    if (products.length === 0) return null;
    return [...products]
      .filter((p) => p.salePrice && p.stock > 0)
      .sort((a, b) => {
        const discA = discountPercent(a.price, a.salePrice!);
        const discB = discountPercent(b.price, b.salePrice!);
        return discB - discA;
      })[0];
  }, [products]);

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

  // Statistics
  const totalSavings = useMemo(() => {
    return products.reduce((acc, p) => {
      if (p.salePrice) return acc + (p.price - p.salePrice);
      return acc;
    }, 0);
  }, [products]);

  const maxDiscount = useMemo(() => {
    if (products.length === 0) return 0;
    const discounts = products
      .filter((p) => p.salePrice)
      .map((p) => discountPercent(p.price, p.salePrice!));
    return discounts.length > 0 ? Math.max(...discounts) : 0;
  }, [products]);

  // Countdown timer for Spotlight Deal (simulate 24 hours resetting daily if no endDate is present)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    let targetTime: number;

    if (spotlightProduct?.saleEndDate) {
      targetTime = new Date(spotlightProduct.saleEndDate).getTime();
    } else {
      // Midnight today
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      targetTime = midnight.getTime();
    }

    const interval = setInterval(() => {
      const difference = targetTime - Date.now();
      
      if (difference <= 0) {
        // Reset to next 24h if it was simulated, otherwise stop
        if (!spotlightProduct?.saleEndDate) {
          const nextMidnight = new Date();
          nextMidnight.setHours(24, 0, 0, 0);
          targetTime = nextMidnight.getTime();
        } else {
          clearInterval(interval);
          return;
        }
      }

      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours: h, minutes: m, seconds: s });
    }, 1000);

    return () => clearInterval(interval);
  }, [spotlightProduct]);

  // Add to cart function for spotlight product
  const handleSpotlightAddToCart = () => {
    if (!spotlightProduct) return;
    cart.addItem(
      {
        id: spotlightProduct.id,
        name: spotlightProduct.name,
        slug: spotlightProduct.slug,
        price: spotlightProduct.salePrice || spotlightProduct.price,
        image: spotlightProduct.image || "",
        quantity: 1,
        maxStock: spotlightProduct.stock,
      },
      !!session
    );
    toast.success(`Added ${spotlightProduct.name} to cart!`);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Premium Hero with Spotlight Deal split */}
      <section className="relative overflow-hidden bg-radial from-gray-900 via-neutral-950 to-black text-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 border border-white/5 shadow-2xl">
        {/* Background Gradients and grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

        <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Hero text side */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 backdrop-blur-md px-4.5 py-2 rounded-2xl">
              <Flame size={14} className="text-red-500 animate-pulse" fill="currentColor" />
              <span className="text-red-400 text-xs font-black uppercase tracking-widest">
                Flash Clearance Deals
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none uppercase">
                HOT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-indigo-500">GEARS.</span>
                <br />
                COLD PRICES.
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-xl font-medium leading-relaxed">
                Step up your battlestation setup with the finest mechanical keyboards, high-precision mice, and audiophile headsets at extreme discounts.
              </p>
            </div>

            {/* Stats block */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md pt-2">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-xs hover:border-white/10 transition-all">
                <p className="text-2xl sm:text-3xl font-black text-white">{products.length}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Active Deals</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-xs hover:border-white/10 transition-all">
                <p className="text-2xl sm:text-3xl font-black text-red-500">-{maxDiscount}%</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Max Savings</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-xs hover:border-white/10 transition-all">
                <p className="text-2xl sm:text-3xl font-black text-emerald-500">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalSavings)}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Total Savings</p>
              </div>
            </div>
          </div>

          {/* Spotlight Deal side */}
          {spotlightProduct && (
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 rounded-[2rem] p-6.5 relative overflow-hidden shadow-2xl group/spotlight">
                {/* Glow behind product image */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover/spotlight:bg-red-500/20 transition-all duration-700" />
                
                {/* Sale label top left */}
                <div className="absolute top-5 left-5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  Spotlight Deal
                </div>

                {/* Countdown Timer top right */}
                <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/5 border border-white/10 backdrop-blur-sm text-gray-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                  <Clock size={12} className="text-orange-400" />
                  <span>
                    {timeLeft.hours.toString().padStart(2, "0")}:
                    {timeLeft.minutes.toString().padStart(2, "0")}:
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </span>
                </div>

                {/* Spotlight Image */}
                <div className="aspect-square w-full max-w-[200px] mx-auto relative flex items-center justify-center mt-6">
                  {spotlightProduct.image ? (
                    <Image
                      src={spotlightProduct.image}
                      alt={spotlightProduct.name}
                      fill
                      className="object-contain p-2 drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover/spotlight:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-gray-500 italic">No Image</div>
                  )}
                </div>

                {/* Details */}
                <div className="mt-8 space-y-4 text-center lg:text-left">
                  <div className="space-y-1">
                    {spotlightProduct.brand && (
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        {spotlightProduct.brand}
                      </p>
                    )}
                    <h3 className="text-xl font-black text-white tracking-tight line-clamp-1 group-hover/spotlight:text-red-400 transition-colors">
                      {spotlightProduct.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <span className="text-3xl font-black text-white">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(spotlightProduct.salePrice!)}
                    </span>
                    <span className="text-sm font-bold text-gray-500 line-through">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(spotlightProduct.price)}
                    </span>
                    <span className="bg-red-500/20 text-red-400 text-xs font-black px-2.5 py-1 rounded-full uppercase">
                      Save {discountPercent(spotlightProduct.price, spotlightProduct.salePrice!)}%
                    </span>
                  </div>

                  {/* Add To Cart */}
                  <button
                    onClick={handleSpotlightAddToCart}
                    className="w-full bg-white text-black hover:bg-red-500 hover:text-white h-[48px] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98"
                  >
                    <ShoppingCart size={15} strokeWidth={2.5} />
                    Claim Deal Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Browse Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">
              All Sale <span className="text-indigo-600">Offers</span>
            </h2>
            <p className="text-sm text-gray-400 font-bold">
              {filteredAndSortedProducts.length} deals available matching your preferences
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-gray-700 cursor-pointer"
              >
                <option value="discount">Biggest Discount %</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Added</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 2 && (
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {cat} <span className={`ml-1 text-[10px] opacity-70`}>({categoryCounts[cat] || 0})</span>
              </button>
            ))}
          </div>
        )}

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
