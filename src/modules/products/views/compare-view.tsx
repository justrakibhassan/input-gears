"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  ShoppingCart,
  Zap,
  Box,
  Cpu,
  Wifi,
  Layers,
  ChevronDown,
  Trash2,
  Printer,
  Share2,
  Heart,
  Search,
  Loader2,
} from "lucide-react";
import { useCompare, CompareItem } from "@/modules/products/hooks/use-compare";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useSession } from "@/lib/auth-client";
import { getReviewStats } from "@/modules/reviews/actions";
import { getProductById } from "@/modules/products/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";

// --- Configuration ---
interface SpecGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  keys: { key: string; label: string }[];
}

const STATIC_GROUPS: SpecGroup[] = [
  {
    id: "connectivity",
    name: "Networking & Connectivity",
    icon: Wifi,
    keys: [
      { key: "connectivity", label: "Connectivity" },
      { key: "bluetooth", label: "Bluetooth" },
    ],
  },
  {
    id: "audio",
    name: "Audio & Microphone",
    icon: Zap,
    keys: [
      { key: "noiseCancelling", label: "Noise Cancelling" },
      { key: "audioTechnology", label: "Audio Technology" },
    ],
  },
  {
    id: "battery",
    name: "Battery And Power",
    icon: Box,
    keys: [
      { key: "chargingPort", label: "Charging port" },
      { key: "playbackTime", label: "Playback Time" },
    ],
  },
  {
    id: "others",
    name: "Others",
    icon: Layers,
    keys: [
      { key: "compatibility", label: "Compatibility" },
      { key: "otherFeatures", label: "Other Features" },
      { key: "includedInBox", label: "Included in the Box" },
    ],
  },
];

export default function CompareView() {
  const compare = useCompare();
  const cart = useCart();
  const wishlist = useWishlist();
  const { data: session } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const hideIdentical = false;

  // Interactive analysis states
  const [hoveredColIndex, setHoveredColIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { averageRating: number; totalReviews: number }>>({});

  // Autocomplete search states
  const [q0, setQ0] = useQueryState("q0", parseAsString.withDefault(""));
  const [q1, setQ1] = useQueryState("q1", parseAsString.withDefault(""));
  const [q2, setQ2] = useQueryState("q2", parseAsString.withDefault(""));
  const [q3, setQ3] = useQueryState("q3", parseAsString.withDefault(""));

  const searchQueries = useMemo(() => [q0, q1, q2, q3], [q0, q1, q2, q3]);
  const handleSetSearchQuery = (slotIdx: number, value: string) => {
    if (slotIdx === 0) setQ0(value || null);
    if (slotIdx === 1) setQ1(value || null);
    if (slotIdx === 2) setQ2(value || null);
    if (slotIdx === 3) setQ3(value || null);
  };

  const [searchResults, setSearchResults] = useState<any[][]>([[], [], [], []]);
  const [loadingSlots, setLoadingSlots] = useState<boolean[]>([false, false, false, false]);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const searchTimeoutRefs = useRef<(NodeJS.Timeout | null)[]>([null, null, null, null]);

  // Autocomplete search implementation
  const handleSearchChange = (slotIdx: number, value: string) => {
    handleSetSearchQuery(slotIdx, value);

    if (searchTimeoutRefs.current[slotIdx]) {
      clearTimeout(searchTimeoutRefs.current[slotIdx]!);
    }

    if (!value.trim()) {
      const newResults = [...searchResults];
      newResults[slotIdx] = [];
      setSearchResults(newResults);
      return;
    }

    searchTimeoutRefs.current[slotIdx] = setTimeout(async () => {
      const newLoading = [...loadingSlots];
      newLoading[slotIdx] = true;
      setLoadingSlots(newLoading);

      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          const newResults = [...searchResults];
          newResults[slotIdx] = data;
          setSearchResults(newResults);
        }
      } catch (e) {
        console.error("Autosearch error:", e);
      } finally {
        const nextLoading = [...loadingSlots];
        nextLoading[slotIdx] = false;
        setLoadingSlots(nextLoading);
      }
    }, 300);
  };

  const handleSelectProduct = async (slotIdx: number, productId: string) => {
    setActiveDropdown(null);

    handleSetSearchQuery(slotIdx, "");

    const newResults = [...searchResults];
    newResults[slotIdx] = [];
    setSearchResults(newResults);

    try {
      toast.loading("Fetching product details...", { id: "fetch-product" });
      const res = await getProductById(productId);
      if (res.success && res.data) {
        const newItem: CompareItem = {
          ...res.data,
          image: res.data.image || "",
          specs: (res.data.specs as any) || null,
        };

        const currentItems = [...compare.items];
        
        // Check if item already exists in another slot
        const existsIdx = currentItems.findIndex((i) => i.id === newItem.id);
        if (existsIdx !== -1 && existsIdx !== slotIdx) {
          toast.error(`${newItem.name} is already in comparison`, { id: "fetch-product" });
          return;
        }

        if (slotIdx < currentItems.length) {
          // Override existing slot
          currentItems[slotIdx] = newItem;
          compare.updateItems(currentItems);
          toast.success(`Replaced with ${newItem.name}`, { id: "fetch-product" });
        } else {
          // Append to items
          compare.addItem(newItem);
        }
      } else {
        toast.error("Failed to load details", { id: "fetch-product" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading product details", { id: "fetch-product" });
    }
  };

  // Scroll sync references
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Update navbar height dynamically and handle scroll direction hiding
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateNavbarState = () => {
      const header = document.querySelector("header.sticky");
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        // Scrolling down - hide navbar
        document.documentElement.classList.add("navbar-hidden");
        document.documentElement.style.setProperty("--navbar-height", "0px");
      } else {
        // Scrolling up or at top - show navbar
        document.documentElement.classList.remove("navbar-hidden");
        if (header) {
          document.documentElement.style.setProperty("--navbar-height", `${header.clientHeight}px`);
        }
      }
      lastScrollY = currentScrollY;
    };

    updateNavbarState();
    const timeout = setTimeout(updateNavbarState, 150);

    window.addEventListener("scroll", updateNavbarState, { passive: true });
    window.addEventListener("resize", updateNavbarState, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", updateNavbarState);
      window.removeEventListener("resize", updateNavbarState);
      document.documentElement.classList.remove("navbar-hidden");
    };
  }, []);

  // Track scrolling past page header (160px) to trigger compact sticky row
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPast(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync scroll positions of the compact header and the comparison table
  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const tableEl = tableScrollRef.current;
    if (!headerEl || !tableEl) return;

    let isSyncingHeader = false;
    let isSyncingTable = false;

    const handleHeaderScroll = () => {
      if (isSyncingTable) {
        isSyncingTable = false;
        return;
      }
      isSyncingHeader = true;
      tableEl.scrollLeft = headerEl.scrollLeft;
    };

    const handleTableScroll = () => {
      if (isSyncingHeader) {
        isSyncingHeader = false;
        return;
      }
      isSyncingTable = true;
      headerEl.scrollLeft = tableEl.scrollLeft;
    };

    headerEl.addEventListener("scroll", handleHeaderScroll, { passive: true });
    tableEl.addEventListener("scroll", handleTableScroll, { passive: true });

    return () => {
      headerEl.removeEventListener("scroll", handleHeaderScroll);
      tableEl.removeEventListener("scroll", handleTableScroll);
    };
  }, [isScrolledPast, compare.items]);

  // Handle mobile state detection (limit to max 2 items to prevent overflow)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch product ratings dynamically from database reviews
  useEffect(() => {
    async function loadRatings() {
      const newRatings: Record<string, { averageRating: number; totalReviews: number }> = {};
      await Promise.all(
        compare.items.map(async (item) => {
          try {
            const res = await getReviewStats(item.id);
            if (res.success && res.data) {
              newRatings[item.id] = res.data;
            }
          } catch (e) {
            console.error("Failed to load rating for", item.id, e);
          }
        })
      );
      setRatings(newRatings);
    }
    if (compare.items.length > 0) {
      loadRatings();
    }
  }, [compare.items]);

  const displayedItems = useMemo(() => {
    return isMobile ? compare.items.slice(0, 2) : compare.items;
  }, [compare.items, isMobile]);

  const totalSlots = isMobile ? 2 : 4;

  const slotItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < totalSlots; i++) {
      items.push(compare.items[i] || null);
    }
    return items;
  }, [compare.items, totalSlots]);


  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Comparison link copied", {
        description: "You can now share this comparison page with others."
      });
    }
  };

  const handleAddToCart = (item: CompareItem) => {
    cart.addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
      quantity: 1,
      maxStock: 99,
    }, !!session);
  };

  const handleToggleWishlist = (item: CompareItem) => {
    wishlist.toggleItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
      stock: 99,
      category: item.category ? { name: item.category.name } : null
    }, !!session);
  };

  // Helper: determine dynamic spec groups
  const baseSpecGroups = useMemo(() => {
    const groups = [...STATIC_GROUPS];
    const extraKeys = new Set<string>();
    const predefinedKeys = new Set(
      STATIC_GROUPS.flatMap((g) => g.keys.map((s) => s.key.toLowerCase()))
    );

    compare.items.forEach((item) => {
      if (item.specs) {
        Object.keys(item.specs).forEach((k) => {
          if (!predefinedKeys.has(k.toLowerCase())) extraKeys.add(k.toLowerCase());
        });
      }
    });

    if (extraKeys.size > 0) {
      groups.push({
        id: "additional",
        name: "Technical Info",
        icon: Cpu,
        keys: Array.from(extraKeys).map((k) => ({
          key: k,
          label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1"),
        })),
      });
    }
    return groups;
  }, [compare.items]);

  // Spec value retriever
  const getDisplayValue = (item: CompareItem, key: string) => {
    if (!item) return "-";
    const searchKey = key.toLowerCase();
    
    // Check top level first
    const topLevelKey = (Object.keys(item) as Array<keyof CompareItem>).find(
      (k) => k.toString().toLowerCase() === searchKey
    );
    if (topLevelKey) {
      const val = item[topLevelKey];
      return Array.isArray(val) ? (val.length > 0 ? val.join(", ") : "-") : (val ?? "-");
    }

    // Check specs
    if (item.specs) {
      const specs = item.specs as Record<string, string | number | boolean>;
      const specKey = Object.keys(specs).find((k) => k.toLowerCase() === searchKey);
      if (specKey && specs[specKey] !== undefined && specs[specKey] !== null) {
        return specs[specKey];
      }
    }
    return "-";
  };

  // Check if a spec value differs among compared items
  const isSpecDifferent = (key: string) => {
    if (displayedItems.length <= 1) return false;
    const firstVal = String(getDisplayValue(displayedItems[0], key)).trim().toLowerCase();
    for (let i = 1; i < displayedItems.length; i++) {
      const currentVal = String(getDisplayValue(displayedItems[i], key)).trim().toLowerCase();
      if (currentVal !== firstVal) {
        return true;
      }
    }
    return false;
  };

  // Check if average rating differs
  const isRatingDifferent = () => {
    if (displayedItems.length <= 1) return false;
    const getRatingVal = (id: string) => {
      const r = ratings[id]?.averageRating || 0;
      return r.toFixed(1);
    };
    const firstVal = getRatingVal(displayedItems[0].id);
    for (let i = 1; i < displayedItems.length; i++) {
      if (getRatingVal(displayedItems[i].id) !== firstVal) {
        return true;
      }
    }
    return false;
  };

  // Filter groups depending on the hideIdentical state
  const filteredSpecGroups = useMemo(() => {
    return baseSpecGroups.map((group) => {
      const visibleKeys = group.keys.filter((k) => {
        if (hideIdentical && !isSpecDifferent(k.key)) {
          return false; // hide identical specs
        }
        return true;
      });
      return {
        ...group,
        keys: visibleKeys,
      };
    }).filter((group) => group.keys.length > 0); // hide empty groups
  }, [baseSpecGroups, hideIdentical, compare.items]);

  const renderRatingStars = (productId: string) => {
    const stat = ratings[productId] || { averageRating: 0, totalReviews: 0 };
    const rating = stat.averageRating;
    const rounded = Math.round(rating);
    
    return (
      <div className="flex items-center justify-center gap-1 font-bold text-xs">
        <span className="text-amber-500 tracking-tighter">
          {"★".repeat(rounded) + "☆".repeat(5 - rounded)}
        </span>
        <span className="text-zinc-650 font-bold ml-1">{rating > 0 ? rating.toFixed(1) : "0.0"}</span>
      </div>
    );
  };

  if (!isMounted) return null;

  if (compare.items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-slate-50/35 select-none">
        <div className="w-full max-w-[400px] bg-[#FEEFA0] border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 shadow-lg shadow-amber-100/30">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              Product Comparison
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              You have not chosen any products to compare.
            </p>
          </div>

          {/* Autocomplete Input 1 */}
          <div className="relative w-full search-container">
            {compare.items[0] ? (
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  value={compare.items[0].name}
                  className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none truncate"
                />
                <button
                  onClick={() => compare.removeItem(compare.items[0].id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search and Select Product"
                  value={searchQueries[0]}
                  onChange={(e) => handleSearchChange(0, e.target.value)}
                  onFocus={() => setActiveDropdown(0)}
                  className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all text-slate-800"
                />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                {activeDropdown === 0 && (searchQueries[0].trim() || loadingSlots[0]) && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {loadingSlots[0] ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-indigo-500" />
                        Searching...
                      </div>
                    ) : searchResults[0]?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No products found
                      </div>
                    ) : (
                      searchResults[0]?.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(0, p.id)}
                          className="w-full p-2.5 flex items-center gap-2 hover:bg-slate-50 text-left cursor-pointer border-none bg-transparent"
                        >
                          <div className="relative w-7 h-7 bg-slate-50 rounded border flex items-center justify-center shrink-0">
                            <Image
                              src={p.image || "/placeholder.jpg"}
                              alt={p.name}
                              fill
                              className="object-contain p-0.5"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 truncate flex-1">
                            {p.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Autocomplete Input 2 */}
          <div className="relative w-full search-container">
            {compare.items[1] ? (
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  value={compare.items[1].name}
                  className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none truncate"
                />
                <button
                  onClick={() => compare.removeItem(compare.items[1].id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search and Select Product"
                  value={searchQueries[1]}
                  onChange={(e) => handleSearchChange(1, e.target.value)}
                  onFocus={() => setActiveDropdown(1)}
                  className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all text-slate-800"
                />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                {activeDropdown === 1 && (searchQueries[1].trim() || loadingSlots[1]) && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {loadingSlots[1] ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-indigo-500" />
                        Searching...
                      </div>
                    ) : searchResults[1]?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No products found
                      </div>
                    ) : (
                      searchResults[1]?.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(1, p.id)}
                          className="w-full p-2.5 flex items-center gap-2 hover:bg-slate-50 text-left cursor-pointer border-none bg-transparent"
                        >
                          <div className="relative w-7 h-7 bg-slate-50 rounded border flex items-center justify-center shrink-0">
                            <Image
                              src={p.image || "/placeholder.jpg"}
                              alt={p.name}
                              fill
                              className="object-contain p-0.5"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 truncate flex-1">
                            {p.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Comparison Button */}
          <button
            onClick={() => {
              if (compare.items.length > 0) {
                // Will automatically re-render view with compare elements
              } else {
                toast.error("Please select at least 1 product to compare");
              }
            }}
            className="w-full h-11 border border-indigo-700 text-indigo-900 bg-transparent rounded-xl text-xs font-bold transition-all hover:bg-indigo-700 hover:text-white cursor-pointer flex items-center justify-center active:scale-[0.98]"
          >
            View Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        
        {/* Minimalist Top Header (Mockup Style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200/60 print:hidden select-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold">
              Compare up to 4 products side by side
            </p>
          </div>
          
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer size={13} />
              Print
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Share2 size={13} />
              Share
            </button>

            {/* Clear All Button */}
            <button
              onClick={() => compare.clearCompare()}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Trash2 size={13} />
              Clear All
            </button>

            {/* Add Products Link */}
            <Link
              href="/products"
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all shadow-sm active:scale-97 cursor-pointer"
            >
              <Plus size={13} strokeWidth={2.5} />
              ADD
            </Link>
          </div>
        </div>

        {/* Mobile max limit alert */}
        {isMobile && compare.items.length > 2 && (
          <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-3 mb-5 text-amber-800 text-xs font-semibold text-center select-none print:hidden shadow-xs">
            Showing first 2 products for mobile readability. View on a larger screen to compare all.
          </div>
        )}

        {/* Separate Scroll-Synced Sticky Product Header Row */}
        <AnimatePresence>
          {isScrolledPast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              style={{ top: "var(--navbar-height, 0px)" }}
              className="sticky z-30 bg-white border-y border-slate-200/80 shadow-md print:hidden w-full overflow-hidden"
            >
              <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                <div ref={headerScrollRef} className="overflow-x-auto no-scrollbar flex w-full">
                  {/* Left Label Spacer */}
                  <div className="w-[90px] md:w-[200px] min-w-[90px] md:min-w-[200px] shrink-0 bg-slate-50 border-r border-slate-200/85 p-3 flex items-center font-medium text-[10px] sm:text-xs text-zinc-500">
                    <span className="hidden md:inline">You can add <span className="italic ml-1">Max 4 Products</span></span>
                    <span className="md:hidden font-bold">Compare</span>
                  </div>
                  
                  {/* Product Column Compact Previews */}
                  {slotItems.map((item, idx) => {
                    if (item) {
                      return (
                        <div
                          key={`sticky-item-${item.id}`}
                          onMouseEnter={() => setHoveredColIndex(idx)}
                          onMouseLeave={() => setHoveredColIndex(null)}
                          className={cn(
                            "p-3 border-l border-zinc-100 flex-1 flex items-center justify-between gap-2 bg-white transition-colors duration-150",
                            hoveredColIndex === idx && "bg-indigo-50/5"
                          )}
                          style={{
                            width: isMobile ? `calc((100% - 90px) / ${totalSlots})` : `calc((100% - 200px) / 4)`,
                            minWidth: isMobile ? `calc((100% - 90px) / ${totalSlots})` : `calc((100% - 200px) / 4)`
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="relative w-8 h-8 bg-zinc-50 rounded-lg p-0.5 border border-zinc-100 flex items-center justify-center shrink-0">
                              <Image src={item.image} alt={item.name} fill className="object-contain p-0.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-zinc-850 truncate block" title={item.name}>
                                {item.name}
                              </span>
                              <div className="text-red-500 font-extrabold text-[10px] mt-0.5">
                                ৳{item.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => compare.removeItem(item.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 rounded-lg transition-all shrink-0"
                              title="Remove"
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`sticky-empty-${idx}`}
                          className="p-3 border-l border-zinc-100 flex-1 flex items-center justify-center bg-zinc-50/20 text-zinc-400"
                          style={{
                            width: isMobile ? `calc((100% - 90px) / ${totalSlots})` : `calc((100% - 200px) / 4)`,
                            minWidth: isMobile ? `calc((100% - 90px) / ${totalSlots})` : `calc((100% - 200px) / 4)`
                          }}
                        >
                          <span className="text-[10px] font-bold text-zinc-400">Empty Slot</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Comparison Container */}
        <div className="bg-white shadow-xl shadow-slate-100 rounded-3xl border border-slate-100 overflow-hidden">
          <div ref={tableScrollRef} className="overflow-hidden w-full">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: isMobile ? '90px' : '200px' }} />
                <col style={{ width: isMobile ? `calc((100% - 90px) / 2)` : `calc((100% - 200px) / 4)` }} />
                <col style={{ width: isMobile ? `calc((100% - 90px) / 2)` : `calc((100% - 200px) / 4)` }} />
                {!isMobile && (
                  <>
                    <col style={{ width: `calc((100% - 200px) / 4)` }} />
                    <col style={{ width: `calc((100% - 200px) / 4)` }} />
                  </>
                )}
              </colgroup>
              <tbody>
                {/* Product Header Row */}
                <tr className="border-b border-zinc-100 relative">
                  <td className="p-2.5 sm:p-6 bg-zinc-50 border-r border-zinc-200/80 w-[90px] md:w-[200px] min-w-[90px] md:min-w-[200px] shadow-[4px_0_8px_-3px_rgba(0,0,0,0.06)]">
                    <div className="text-zinc-500 font-medium text-[10px] sm:text-sm leading-tight">
                      <span className="hidden md:inline">You can add <span className="italic">Max 4 Products</span></span>
                      <span className="md:hidden font-bold">Compare</span>
                    </div>
                  </td>
                  
                  {slotItems.map((item, idx) => (
                    <td
                      key={`header-slot-${idx}`}
                      onMouseEnter={() => setHoveredColIndex(idx)}
                      onMouseLeave={() => setHoveredColIndex(null)}
                      className={cn(
                        "p-2.5 sm:p-4 text-center border-l border-zinc-100 bg-white transition-all duration-300 relative py-4 sm:py-8",
                        hoveredColIndex === idx && "bg-indigo-50/5"
                      )}
                    >
                      {item ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          {/* Search box with product name & close button */}
                          <div className="relative w-full search-container text-left">
                            <input
                              type="text"
                              placeholder="Search and Select Product"
                              value={activeDropdown === idx ? searchQueries[idx] : item.name}
                              onChange={(e) => handleSearchChange(idx, e.target.value)}
                              onFocus={() => {
                                setActiveDropdown(idx);
                                handleSetSearchQuery(idx, "");
                              }}
                              className="w-full h-8 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 outline-none truncate focus:bg-white focus:border-indigo-500 transition-all"
                            />
                            <button
                              onClick={() => compare.removeItem(item.id)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-0.5"
                              title="Remove"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>

                            {activeDropdown === idx && (searchQueries[idx].trim() || loadingSlots[idx]) && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {loadingSlots[idx] ? (
                                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                                    <Loader2 size={12} className="animate-spin text-indigo-500" />
                                    Searching...
                                  </div>
                                ) : searchResults[idx]?.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    No products found
                                  </div>
                                ) : (
                                  searchResults[idx]?.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleSelectProduct(idx, p.id)}
                                      className="w-full p-2.5 flex items-center gap-2 hover:bg-slate-50 text-left cursor-pointer border-none bg-transparent"
                                    >
                                      <div className="relative w-7 h-7 bg-slate-50 rounded border flex items-center justify-center shrink-0">
                                        <Image
                                          src={p.image || "/placeholder.jpg"}
                                          alt={p.name}
                                          fill
                                          className="object-contain p-0.5"
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-800 truncate flex-1">
                                        {p.name}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {/* Image Block */}
                          <div className="relative w-20 h-20 sm:w-36 sm:h-36 bg-zinc-50/50 rounded-2xl p-1 sm:p-2 border border-zinc-100/80 flex items-center justify-center mt-1">
                            <Image src={item.image} alt={item.name} fill className="object-contain p-1 sm:p-2" />
                            <button
                              onClick={() => compare.removeItem(item.id)}
                              className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 border border-white hover:bg-red-600 transition-all z-10 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer shadow-md"
                              title="Remove from comparison"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                          
                          <div className="space-y-1 w-full text-center px-0.5">
                            <Link
                              href={`/products/${item.slug}`}
                              className="text-[10px] sm:text-sm font-bold text-zinc-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight min-h-[30px] sm:min-h-[36px]"
                            >
                              {item.name}
                            </Link>
                            {/* Price in red */}
                            <div className="text-red-500 font-extrabold text-[12px] sm:text-[16px]">
                              ৳{item.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-start h-full min-h-[160px] sm:min-h-[220px] gap-4 w-full">
                          {/* Active Autocomplete Input for Slot */}
                          <div className="relative w-full search-container text-left">
                            <input
                              type="text"
                              placeholder="Search and Select Product"
                              value={searchQueries[idx]}
                              onChange={(e) => handleSearchChange(idx, e.target.value)}
                              onFocus={() => setActiveDropdown(idx)}
                              className="w-full h-8 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:border-indigo-500 transition-all text-slate-800"
                            />
                            <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

                            {activeDropdown === idx && (searchQueries[idx].trim() || loadingSlots[idx]) && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {loadingSlots[idx] ? (
                                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                                    <Loader2 size={12} className="animate-spin text-indigo-500" />
                                    Searching...
                                  </div>
                                ) : searchResults[idx]?.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    No products found
                                  </div>
                                ) : (
                                  searchResults[idx]?.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleSelectProduct(idx, p.id)}
                                      className="w-full p-2.5 flex items-center gap-2 hover:bg-slate-50 text-left cursor-pointer border-none bg-transparent"
                                    >
                                      <div className="relative w-7 h-7 bg-slate-50 rounded border flex items-center justify-center shrink-0">
                                        <Image
                                          src={p.image || "/placeholder.jpg"}
                                          alt={p.name}
                                          fill
                                          className="object-contain p-0.5"
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-800 truncate flex-1">
                                        {p.name}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-4">
                            <Plus size={24} className="text-zinc-300 mb-1.5" />
                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 max-w-[120px] leading-tight">
                              Find and select product to compare
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>



                {/* Availability Row */}
                {(!hideIdentical || isSpecDifferent("availability")) && (
                  <tr className={cn(
                    "border-b border-zinc-100 hover:bg-indigo-50/10 transition-colors duration-150",
                    isSpecDifferent("availability") && "bg-[#FFF8E6]"
                  )}>
                    <td className="sticky left-0 z-20 bg-zinc-50/95 border-r border-zinc-200/80 font-semibold text-zinc-700 text-[10px] sm:text-sm px-2 sm:px-4 py-3 sm:py-4 w-[90px] md:w-[200px] min-w-[90px] md:min-w-[200px] shadow-[4px_0_8px_-3px_rgba(0,0,0,0.04)]">
                      Availability
                    </td>
                    {slotItems.map((item, idx) => {
                      const isDiff = isSpecDifferent("availability");
                      return (
                        <td 
                          key={`avail-slot-${idx}`} 
                          onMouseEnter={() => setHoveredColIndex(idx)}
                          onMouseLeave={() => setHoveredColIndex(null)}
                          className={cn(
                            "p-2 sm:p-4 text-center border-l border-zinc-100 transition-colors duration-150 text-[10px] sm:text-xs",
                            isDiff ? "bg-[#FFF8E6]" : "bg-white",
                            hoveredColIndex === idx && (isDiff ? "bg-[#FFF3D6]" : "bg-indigo-50/5")
                          )}
                        >
                          {item ? (
                            <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-extrabold rounded-full border border-emerald-100">
                              {item.availability || "In Stock"}
                            </span>
                          ) : (
                            <span className="text-zinc-350">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}

                {/* Brand, Category, Rating, Warranty */}
                {["Brand", "Category", "Rating", "Warranty"].map((label) => {
                  const searchKey = label.toLowerCase();
                  const isDiff = searchKey === "rating" ? isRatingDifferent() : isSpecDifferent(searchKey);
                  if (hideIdentical && !isDiff) return null;

                  return (
                    <tr 
                      key={label} 
                      className={cn(
                        "border-b border-zinc-100 hover:bg-indigo-50/10 transition-colors duration-150",
                        isDiff && "bg-[#FFF8E6]"
                      )}
                    >
                      <td className="sticky left-0 z-20 bg-zinc-50/95 border-r border-zinc-200/80 font-semibold text-zinc-700 text-[10px] sm:text-sm px-2 sm:px-4 py-3 sm:py-4 w-[90px] md:w-[200px] min-w-[90px] md:min-w-[200px] shadow-[4px_0_8px_-3px_rgba(0,0,0,0.04)]">
                        {label}
                      </td>
                      {slotItems.map((item, idx) => {
                        return (
                          <td 
                            key={`${label.toLowerCase()}-slot-${idx}`} 
                            onMouseEnter={() => setHoveredColIndex(idx)}
                            onMouseLeave={() => setHoveredColIndex(null)}
                            className={cn(
                              "p-2 sm:p-4 text-center border-l border-zinc-100 text-[11px] sm:text-[13px] text-slate-700 font-semibold transition-colors duration-150",
                              isDiff ? "bg-[#FFF8E6]" : "bg-white",
                              hoveredColIndex === idx && (isDiff ? "bg-[#FFF3D6]" : "bg-indigo-50/5")
                            )}
                          >
                            {item ? (
                              searchKey === "category" ? (
                                item.category?.name || "Gadget"
                              ) : searchKey === "rating" ? (
                                renderRatingStars(item.id)
                              ) : (
                                String(getDisplayValue(item, searchKey) || "-")
                              )
                            ) : (
                              <span className="text-zinc-350">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Specification Groups */}
                {filteredSpecGroups.map((group) => (
                  <React.Fragment key={group.id}>
                    {/* Group Header Bar */}
                    <tr>
                      <td colSpan={totalSlots + 1} className="bg-gradient-to-r from-indigo-50/80 to-white p-0 border-b border-zinc-200/80 relative">
                        <button
                          onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                          className="sticky left-0 flex items-center justify-between w-full px-4 py-3 group/btn text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] sm:text-[12px] font-bold text-indigo-950">
                              {group.name}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                              ({group.keys.length} specs)
                            </span>
                          </div>
                          <ChevronDown 
                            size={14} 
                            className={cn(
                              "text-indigo-500 transition-transform duration-300 ml-auto shrink-0",
                              !collapsedGroups[group.id] && "rotate-180"
                            )} 
                          />
                        </button>
                      </td>
                    </tr>

                    {/* Group Content */}
                    <AnimatePresence initial={false}>
                      {!collapsedGroups[group.id] && (
                        <>
                          {group.keys.map((spec) => {
                            const isDiff = isSpecDifferent(spec.key);

                            return (
                              <motion.tr
                                key={spec.key}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                  "border-b border-zinc-100 hover:bg-indigo-50/10 transition-colors duration-150",
                                  isDiff && "bg-[#FFF8E6]"
                                )}
                              >
                                <td className="sticky left-0 z-20 bg-zinc-50/95 border-r border-zinc-200/80 font-semibold text-zinc-700 text-[10px] sm:text-sm px-2 sm:px-4 py-3 sm:py-4 w-[90px] md:w-[200px] min-w-[90px] md:min-w-[200px] shadow-[4px_0_8px_-3px_rgba(0,0,0,0.04)]">
                                  {spec.label}
                                </td>
                                {slotItems.map((item, idx) => {
                                  return (
                                    <td 
                                      key={`${group.id}-${spec.key}-slot-${idx}`} 
                                      onMouseEnter={() => setHoveredColIndex(idx)}
                                      onMouseLeave={() => setHoveredColIndex(null)}
                                      className={cn(
                                        "p-2 sm:p-4 text-center border-l border-zinc-100 text-[11px] sm:text-[13px] text-slate-700 font-semibold leading-relaxed transition-colors duration-150",
                                        isDiff ? "bg-[#FFF8E6]" : "bg-white",
                                        hoveredColIndex === idx && (isDiff ? "bg-[#FFF3D6]" : "bg-indigo-50/5")
                                      )}
                                    >
                                      {item ? String(getDisplayValue(item, spec.key) || "-") : <span className="text-zinc-350">-</span>}
                                    </td>
                                  );
                                })}
                              </motion.tr>
                            );
                          })}
                        </>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .comparison-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .comparison-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        .comparison-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .comparison-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @media print {
          header, footer, .print-hidden, button, a, .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .comparison-scrollbar {
            overflow: visible !important;
          }
          table {
            border: 1px solid #e2e8f0 !important;
          }
        }
        header.sticky {
          transition: transform 0.3s ease-in-out !important;
        }
        .navbar-hidden header.sticky {
          transform: translateY(-100%) !important;
        }
        .lg\:hidden.fixed.bottom-0.z-1100 {
          transition: transform 0.35s ease-in-out !important;
        }
        .navbar-hidden .lg\:hidden.fixed.bottom-0.z-1100 {
          transform: translateY(100%) !important;
        }
      `}</style>
    </div>
  );
}
