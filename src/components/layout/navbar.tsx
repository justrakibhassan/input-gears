"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  User,
  Menu,
  X,
  Heart,
  ChevronRight,
  Zap,
  ShoppingBag,
  Keyboard,
  Mouse,
  Headphones,
  Monitor,
  Cpu,
  ArrowLeftRight,
  ChevronDown,
  LucideIcon,
  Plus,
  Minus,
  Tag,
  Truck,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import UserNav from "../../modules/auth/components/user-nav";
import dynamic from "next/dynamic";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import MobileBottomNav from "./mobile-bottom-nav";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./use-mobile-nav";
import { useScrollLock } from "@/hooks/use-scroll-lock";

// Dynamically import CartNav with SSR disabled
const CartNav = dynamic(
  () => import("../../modules/cart/components/cart-nav"),
  {
    ssr: false,
    loading: () => (
      <button className="relative hidden md:inline-flex p-2 text-gray-300 bg-gray-50 rounded-full animate-pulse cursor-wait">
        <ShoppingBag size={24} />
      </button>
    ),
  }
);

interface CategoryWithBrands {
  id: string;
  name: string;
  slug: string;
  brands: string[];
  parentId: string | null;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  brands: string[];
  parentId: string | null;
  children: CategoryNode[];
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  keyboards: Keyboard,
  mice: Mouse,
  audio: Headphones,
  monitors: Monitor,
  accessories: Cpu,
};

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category: { name: string } | null;
}

export default function Navbar({ initialCategories = [] }: { initialCategories?: CategoryWithBrands[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMobileSearchOpen,
    toggleMobileSearch,
  } = useMobileNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [categories, setCategories] = useState<CategoryWithBrands[]>(initialCategories);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

  const { data: session, isPending } = useSession();
  const wishlist = useWishlist();
  const compare = useCompare();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [mobileTab, setMobileTab] = useState<"menu" | "categories">("menu");

  const categoryTree = useMemo(() => {
    const map: Record<string, CategoryNode> = {};
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    const roots: CategoryNode[] = [];
    categories.forEach(cat => {
      const node = map[cat.id];
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [categories]);

  // Sync search query from URL
  const currentQuery = searchParams.get("q") || "";
  const [prevSearch, setPrevSearch] = useState(currentQuery);
  if (currentQuery !== prevSearch) {
    setPrevSearch(currentQuery);
    setSearchQuery(currentQuery);
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Live Search Logic
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearchLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".search-container")) {
        setShowResults(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResults(false);
        setActiveMegaMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useScrollLock(isMobileMenuOpen);

  const wishlistCount = isMounted ? wishlist.items.length : 0;
  const hasWishlistItems = wishlistCount > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setIsMobileMenuOpen(false);
    setShowResults(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full group/nav">
        {/* PRIMARY NAVBAR */}
        <nav
          className={`w-full transition-all duration-500 border-b ${
            isScrolled
              ? "bg-white/60 backdrop-blur-2xl py-3 shadow-md border-white/40 ring-1 ring-black/5"
              : "bg-white py-4 border-gray-200/50"
          }`}
        >
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex md:hidden p-2 text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95 z-10"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
                <Link
                  href="/"
                  className="flex items-center gap-2 group relative"
                >
                  <div className="bg-indigo-600 text-white p-2 rounded-xl transform group-hover:rotate-10 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-indigo-200">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black tracking-tight font-sans text-gray-900">
                    Input<span className="text-indigo-600">Gears</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden md:flex flex-initial items-center">
              <div className="relative search-container">
                <form
                  onSubmit={handleSearch}
                  className="relative w-[450px] group"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    placeholder="Search gadgets (e.g. Mechanical Keyboard)..."
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl pl-12 pr-4 py-2.5 focus:bg-white focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all duration-500"
                  />
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                  />
                </form>

                <AnimatePresence>
                  {showResults && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden z-100"
                    >
                      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">
                          {isSearchLoading ? "Searching..." : `Found ${searchResults.length} Results`}
                        </span>
                        {isSearchLoading && (
                          <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2 no-scrollbar">
                        {searchResults.length > 0 ? (
                          searchResults.map((p) => (
                            <Link
                              key={p.id}
                              href={`/products/${p.slug}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-4 p-2.5 hover:bg-indigo-50/50 rounded-2xl transition-all group"
                            >
                              <div className="relative h-14 w-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 p-1">
                                {p.image ? (
                                  <NextImage src={p.image} alt={p.name} fill className="object-contain" />
                                ) : (
                                  <Zap className="m-auto text-gray-300" size={20} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-bold text-indigo-600">${p.price}</span>
                                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-full">
                                    {p.category?.name || "Gadget"}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-all transform group-hover:translate-x-1" />
                            </Link>
                          ) )
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-xs font-bold text-gray-600 italic">No exact matches found...</p>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/products?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setShowResults(false)}
                        className="block p-4 text-center text-xs font-black text-indigo-600 hover:bg-indigo-50 border-t border-gray-50 transition-colors uppercase tracking-widest"
                      >
                        View All Results
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 sm:gap-3">
              <Link
                href="/compare"
                className="hidden md:flex p-2.5 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all relative group"
              >
                <ArrowLeftRight
                  size={22}
                  className={`transition-all duration-300 ${
                    isMounted && compare.items.length > 0
                      ? "text-amber-600 scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
                {isMounted && compare.items.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-amber-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                    {compare.items.length}
                  </span>
                )}
              </Link>

              <Link
                href="/account/wishlist"
                className="hidden md:flex p-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all relative group"
              >
                <Heart
                  size={22}
                  className={`transition-all duration-300 ${
                    hasWishlistItems
                      ? "text-indigo-600 scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
                {hasWishlistItems && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleMobileSearch}
                className={`md:hidden p-2.5 rounded-xl transition-all relative ${
                  isMobileSearchOpen
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
                aria-expanded={isMobileSearchOpen}
              >
                {isMobileSearchOpen ? <X size={22} /> : <Search size={22} />}
              </button>

              <CartNav />

              <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />

              {!isMounted || isPending ? (
                <div className="hidden sm:flex items-center gap-2 p-1 rounded-full border border-gray-100 bg-gray-50/50">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse border border-white shrink-0" />
                  <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse hidden lg:block mr-2" />
                </div>
              ) : session ? (
                <div className="hidden sm:block">
                  <UserNav session={session} />
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-gray-200 hover:shadow-indigo-100"
                >
                  <User size={18} />
                  <span className="hidden lg:block">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* SECONDARY NAVBAR (Desktop Categories Mega Menu Row) */}
        <div
          className={`hidden lg:flex w-full bg-white border-b border-gray-100 transition-all duration-300 ${
            isScrolled ? "opacity-0 invisible h-0" : "opacity-100 visible h-[52px]"
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-start gap-8">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Cpu;
              const isActive = activeMegaMenu === cat.slug;

              return (
                <div
                  key={cat.id}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => setActiveMegaMenu(cat.slug)}
                  onMouseLeave={() => setActiveMegaMenu(null)}
                >
                  <Link
                    href={`/${cat.slug}`}
                    className={`group flex items-center h-full px-2 text-[15px] font-semibold transition-colors duration-200 border-b-2 ${
                      isActive 
                        ? "text-indigo-600 border-indigo-600"
                        : "text-gray-700 border-transparent hover:text-indigo-600"
                    }`}
                  >
                    {cat.name}
                  </Link>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 w-[260px] z-50 cursor-default shadow-xl border border-gray-200 bg-white"
                        style={{ marginTop: "1px" }}
                      >
                        <div className="flex flex-col py-2 overflow-y-auto no-scrollbar bg-white max-h-[400px]">
                          {cat.brands.length > 0 ? (
                            cat.brands.map((brand) => (
                              <Link
                                key={brand}
                                href={`/${cat.slug}?brand=${encodeURIComponent(brand)}`}
                                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group/item"
                              >
                                <span className="text-[14px] text-gray-700 font-medium group-hover/item:text-indigo-600">{brand}</span>
                                <ChevronRight size={14} className="text-gray-400 group-hover/item:text-indigo-600" />
                              </Link>
                            ))
                          ) : (
                            <div className="px-5 py-3 text-[14px] text-gray-500 italic">No items found</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-1200"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-1201 w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col"
            >
              {/* Header Card */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-gray-900">
                    Input<span className="text-indigo-600">Gears</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Account Card */}
              <div className="mx-3.5 mt-3.5 p-3 bg-[#161c26] text-white rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white overflow-hidden border border-white/20 shrink-0">
                    {session?.user?.image ? (
                      <NextImage
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-tight truncate">
                      {session?.user ? `Hello, ${session.user.name?.split(" ")[0]}!` : "Hello there!"}
                    </p>
                    {session ? (
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[11px] text-gray-300 hover:text-white underline block truncate mt-0.5"
                      >
                        Manage Account
                      </Link>
                    ) : (
                      <Link
                        href="/sign-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[11px] text-indigo-300 hover:text-white font-medium block truncate mt-0.5"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Switcher: MAIN MENU | CATEGORIES */}
              <div className="grid grid-cols-2 gap-1 mx-3.5 mt-3 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMobileTab("menu")}
                  className={`py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    mobileTab === "menu"
                      ? "bg-[#161c26] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Main Menu
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("categories")}
                  className={`py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    mobileTab === "categories"
                      ? "bg-[#161c26] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Categories
                </button>
              </div>

              {/* Tab Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mobileTab === "menu" ? (
                  <div className="space-y-1">
                    {[
                      { label: "Flash Sale / Offers", href: "/sale", icon: Tag, color: "text-emerald-600", bg: "bg-emerald-50", badge: 0 },
                      { label: "Wishlist", href: "/account/wishlist", icon: Heart, color: "text-pink-600", bg: "bg-pink-50", badge: wishlistCount },
                      { label: "Compare", href: "/compare", icon: ArrowLeftRight, color: "text-amber-600", bg: "bg-amber-50", badge: isMounted ? compare.items.length : 0 },
                      { label: "Track Order", href: "/track-order", icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50", badge: 0 },
                      { label: "All Products", href: "/products", icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50", badge: 0 },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                            <item.icon size={16} />
                          </span>
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge > 0 && (
                            <span className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-black rounded-full bg-indigo-600 text-white">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={15} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categoryTree.map((node) => (
                      <MobileCategoryItem
                        key={node.id}
                        node={node}
                        pathname={pathname}
                        onClose={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Links Section */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Quick Links
                  </p>
                  <div className="flex flex-col space-y-1">
                    <Link
                      href="/sale"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-semibold text-gray-600 hover:text-indigo-600 py-1.5 transition-colors"
                    >
                      New Arrivals & Deals
                    </Link>
                    <Link
                      href="/track-order"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-semibold text-gray-600 hover:text-indigo-600 py-1.5 transition-colors"
                    >
                      Track Your Order
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-semibold text-gray-600 hover:text-indigo-600 py-1.5 transition-colors"
                    >
                      Customer Support
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Sign-In / User Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                {!isMounted || isPending ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-xl" />
                ) : !session ? (
                  <Link
                    href="/sign-in"
                    className="flex items-center justify-center w-full bg-[#161c26] hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Join Now / Sign In
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    className="flex items-center justify-center w-full bg-[#161c26] hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    View Account Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <MobileBottomNav />
    </>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200/50">
      <nav className="w-full py-4">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl" />
          </div>
          <div className="hidden md:flex flex-initial items-center">
            <div className="h-10 w-[450px] bg-gray-50 animate-pulse rounded-2xl" />
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="h-10 w-10 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-10 w-10 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-10 w-px bg-gray-100 mx-1 hidden sm:block" />
            <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-xl hidden sm:block" />
          </div>
        </div>
      </nav>
    </header>
  );
}

function MobileCategoryItem({
  node,
  pathname,
  onClose,
  depth = 0,
}: {
  node: CategoryNode;
  pathname: string;
  onClose: () => void;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const hasBrands = node.brands && node.brands.length > 0;
  const isExpandable = hasChildren || hasBrands;

  const isActive = pathname === `/${node.slug}` || pathname.startsWith(`/${node.slug}/`);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center justify-between rounded-xl transition-all border-l-2",
          isActive
            ? "bg-indigo-50 text-indigo-600 border-indigo-600 font-bold"
            : "text-gray-700 border-transparent hover:text-indigo-600 hover:bg-gray-50/50 font-semibold"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <Link
          href={`/${node.slug}`}
          className="flex-1 py-2 text-[15px]"
          onClick={onClose}
        >
          {node.name}
        </Link>
        {isExpandable && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {isOpen ? (
              <Minus size={16} strokeWidth={2.5} />
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>

      {isOpen && isExpandable && (
        <div className="space-y-1">
          {/* Subcategories (if any) */}
          {hasChildren && node.children.map(child => (
            <MobileCategoryItem
              key={child.id}
              node={child}
              pathname={pathname}
              onClose={onClose}
              depth={depth + 1}
            />
          ))}
          
          {/* Brands list */}
          {hasBrands && (
            <div 
              className="flex flex-col gap-y-1 pt-1 pb-2 border-l border-gray-100"
              style={{ marginLeft: `${(depth + 1) * 12 + 12}px` }}
            >
              {node.brands.map(brand => (
                <Link
                  key={brand}
                  href={`/${node.slug}?brand=${encodeURIComponent(brand)}`}
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-indigo-600 transition-colors font-medium py-1 pl-3 block"
                >
                  {brand}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
