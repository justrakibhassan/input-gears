"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Tag, Heart, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import MobileAccountMenu from "./mobile-account-menu";

const emptySubscribe = () => () => {};

interface Tab {
  name: string;
  icon: React.ElementType;
  href: string;
  isActive: boolean;
  badge?: number;
  isAccountTab?: boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const wishlist = useWishlist();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const wishlistCount = isMounted ? wishlist.items.length : 0;

  const handleToggleAccountMenu = useCallback(() => {
    setIsAccountMenuOpen((prev: boolean) => !prev);
  }, []);

  const handleCloseAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);

  const isAdmin = isMounted && !!session?.user && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes((session.user as { role?: string }).role!);

  const tabs: Tab[] = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
    },
    ...(isAdmin ? [{
      name: "Admin",
      icon: LayoutDashboard,
      href: "/admin",
      isActive: pathname.startsWith("/admin"),
    }] : []),
    {
      name: "Offers",
      icon: Tag,
      href: "/sale",
      isActive: pathname === "/sale",
    },
    {
      name: "Wishlist",
      icon: Heart,
      href: "/account/wishlist",
      isActive: pathname === "/account/wishlist",
      badge: wishlistCount,
    },
    {
      name: "Account",
      icon: User,
      href: (isMounted && session) ? "/account" : "/sign-in",
      isActive: pathname.startsWith("/account") || pathname === "/sign-in",
      isAccountTab: true,
    },
  ];

  const handleTabClick = (tab: Tab, e: React.MouseEvent) => {
    if (tab.isAccountTab && session) {
      e.preventDefault();
      handleToggleAccountMenu();
    }
  };

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-1100 bg-white/95 backdrop-blur-3xl border-t border-gray-100 rounded-t-[32px] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)] pb-safe">
        <nav className="max-w-md mx-auto px-6 pt-3 pb-2 flex items-center justify-between">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const sharedClasses = `relative flex flex-col items-center gap-1 transition-all duration-300 ${
              tab.isActive ? "scale-105" : "hover:scale-105 active:scale-95"
            }`;

            if (tab.isAccountTab && isMounted && session) {
              return (
                <button
                  key={tab.name}
                  onClick={(e) => handleTabClick(tab, e)}
                  className={sharedClasses}
                >
                  <div
                    className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                      tab.isActive
                        ? "text-indigo-600 shadow-[inset_0_0_10px_rgba(79,70,229,0.08)]"
                        : "text-gray-400"
                    }`}
                  >
                    {session.user.image ? (
                      <div className={cn(
                        "relative w-5 h-5 rounded-full overflow-hidden border-2 transition-all",
                        tab.isActive ? "border-indigo-600 shadow-lg shadow-indigo-100 ring-2 ring-indigo-50" : "border-gray-200"
                      )}>
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <Icon size={20} strokeWidth={tab.isActive ? 2.5 : 2} />
                    )}

                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-black tracking-wide transition-colors duration-300 ${
                      tab.isActive ? "text-indigo-600" : "text-gray-600"
                    }`}
                  >
                    {tab.name}
                  </span>
                </button>
              );
            }

            return (
              <Link key={tab.name} href={tab.href} className={sharedClasses}>
                <div
                  className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                    tab.isActive
                      ? "text-indigo-600 shadow-[inset_0_0_10px_rgba(79,70,229,0.08)]"
                      : "text-gray-400"
                  }`}
                >
                  <Icon size={20} strokeWidth={tab.isActive ? 2.5 : 2} />

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-black tracking-wide transition-colors duration-300 ${
                    tab.isActive ? "text-indigo-600" : "text-gray-600"
                  }`}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <MobileAccountMenu
        isOpen={isAccountMenuOpen}
        onClose={handleCloseAccountMenu}
      />
    </>
  );
}
