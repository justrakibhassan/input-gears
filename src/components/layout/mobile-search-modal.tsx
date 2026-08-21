"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Loader2, TrendingUp, ChevronRight, ArrowRight } from "lucide-react";
import { useMobileNav } from "./use-mobile-nav";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category?: { name: string } | null;
}

const TRENDING_SEARCHES = [
  "Mechanical Keyboard",
  "Custom Switches",
  "Wireless Mouse",
  "Desk Mat",
  "Keycaps",
  "Gaming Headset",
];

export default function MobileSearchModal() {
  const { isMobileSearchOpen, closeMobileSearch } = useMobileNav();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useScrollLock(isMobileSearchOpen);

  // Focus input when modal opens, reset it when it closes
  useEffect(() => {
    if (isMobileSearchOpen) {
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(focusTimer);
    }

    setQuery("");
    setResults([]);
  }, [isMobileSearchOpen]);

  // Close on route change
  useEffect(() => {
    closeMobileSearch();
  }, [pathname, closeMobileSearch]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSearchOpen) {
        closeMobileSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSearchOpen, closeMobileSearch]);

  // Live search debounced
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch search results", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    closeMobileSearch();
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    router.push(`/products?q=${encodeURIComponent(term)}`);
    closeMobileSearch();
  };

  if (!isMobileSearchOpen) return null;

  return (
    // Sits below the bottom bar (z-1050) on purpose: the sheet drops from the
    // top, so leaving the bar lit keeps Search a real toggle.
    <div className="fixed inset-0 z-1030 flex flex-col justify-start md:hidden">
      {/* Search Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={closeMobileSearch}
      />

      {/* Search sheet, dropped in from the top */}
      <div className="relative z-10 w-full bg-white shadow-2xl rounded-b-[26px] overflow-hidden animate-in slide-in-from-top-4 duration-300 border-b border-gray-100">
        {/* Search Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
          <p className="text-sm font-bold text-gray-900 tracking-tight">
            Search Products
          </p>
          <button
            type="button"
            onClick={closeMobileSearch}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close search"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              placeholder="Search keyboards, mice, headsets..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-4 pr-14 py-3.5 focus:bg-white focus:border-gray-900 focus:outline-none transition-all placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-14 text-gray-400 hover:text-gray-600 p-1 mr-1"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 bg-[#111111] hover:bg-black text-white px-4 rounded-r-xl flex items-center justify-center transition-colors active:scale-95"
              aria-label="Submit search"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </form>

          {/* Quick Trending Tags (shown when query is empty) */}
          {query.trim().length === 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5">
                <TrendingUp size={13} className="text-indigo-600" />
                <span>Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleTrendingClick(term)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-full transition-colors active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Search Results List */}
          {query.trim().length >= 2 && (
            <div className="mt-3 max-h-[55vh] overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
              {isLoading && results.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  Searching for &quot;{query}&quot;...
                </div>
              ) : results.length > 0 ? (
                <>
                  {results.slice(0, 8).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={closeMobileSearch}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 relative">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                            No Img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {product.name}
                        </h4>
                        {product.category && (
                          <span className="text-[10px] text-gray-600 uppercase font-medium">
                            {product.category.name}
                          </span>
                        )}
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          ${Number(product.price).toFixed(2)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View all results for &quot;{query}&quot;</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm font-semibold text-gray-900">No products found</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
