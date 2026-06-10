"use client";

import { useState, useEffect, useTransition } from "react";
import AdminSidebar from "./admin-sidebar";
import { Menu, Search, Bell, BadgeCheck, ChevronDown, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    image: string | null;
  };
}
export default function AdminLayoutWrapper({
  children,
  user,
}: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const pathname = usePathname();
  const router = useRouter();
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync search input with URL
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchQuery) {
      startTransition(() => {
        setSearchQuery(q);
      });
    }
  }, [searchParams, searchQuery]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    startTransition(() => {
      setIsSidebarOpen(false);
      setIsSearchOpen(false);
    });
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Redirect logic based on current path
    let targetPath = "/admin/products";
    if (pathname.includes("/admin/orders")) targetPath = "/admin/orders";
    if (pathname.includes("/admin/customers")) targetPath = "/admin/customers";

    router.push(`${targetPath}?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
  };

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors">
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* 1. Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* --- Modern Header --- */}
        <header className="h-16 sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-gray-700/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm dark:shadow-none transition-all">
          {/* Left: Mobile Toggle & Breadcrumb Placeholder */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button (Visible only on mobile/tablet) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden md:block font-bold text-gray-700 dark:text-gray-200 tracking-tight">
              Admin Dashboard
            </h2>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <form onSubmit={handleSearch} className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, products..."
                className="w-full bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-300 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-400 text-gray-900 dark:text-gray-100"
              />
            </form>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Search Toggle (Mobile) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors group"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun size={20} className="group-hover:text-amber-500 transition-colors" />
                ) : (
                  <Moon size={20} className="group-hover:text-indigo-600 transition-colors" />
                )}
              </button>
            )}

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800 rounded-full transition-colors group">
              <Bell size={20} className="group-hover:text-gray-700 dark:group-hover:text-gray-200" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 dark:border-gray-800 cursor-pointer group">
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 overflow-hidden shadow-sm dark:shadow-none group-hover:ring-2 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-800 transition-all">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt=""
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-px shadow-sm dark:shadow-none ring-1 ring-gray-100 dark:ring-gray-800">
                  <BadgeCheck
                    size={14}
                    className="text-blue-600 dark:text-blue-400 fill-blue-50 dark:fill-blue-900/30"
                  />
                </div>
              </div>
              <ChevronDown
                size={14}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-400 hidden sm:block"
              />
            </div>
          </div>
        </header>

        {/* Mobile Search Overlay */}
        <div
          className={cn(
            "lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 z-30 transition-all duration-300",
            isSearchOpen
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-4 invisible"
          )}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-gray-900 dark:text-gray-100"
              autoFocus={isSearchOpen}
            />
          </form>
        </div>

        {/* Dynamic Page Content */}
        <main className="p-4 md:p-6 overflow-y-auto h-[calc(100vh-64px)] text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminHeaderSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-800/50/50">
      {/* Sidebar Placeholder */}
      <div className="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full fixed" />

      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="h-16 sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900/80 backdrop-blur-md shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl lg:hidden" />
            <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full hidden md:block" />
          </div>

          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-xl" />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
            <div className="h-9 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          </div>
        </header>
        <main className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="h-8 w-1/4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
            <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          </div>
        </main>
      </div>
    </div>
  );
}
