"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  LogOut,
  X,
  BadgeCheck,
  Shield,
  User as UserIcon,
  ArrowLeftRight,
  Heart,
  Tag,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useScrollLock } from "@/hooks/use-scroll-lock";

export default function MobileAccountMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const compare = useCompare();
  const compareCount = compare.items.length;
  const wishlist = useWishlist();
  const wishlistCount = wishlist.items.length;

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useScrollLock(isOpen);

  const handleLogout = async () => {
    await authClient.signOut();
    toast.success("Logged out successfully");
    onClose();
    router.push("/sign-in");
  };

  if (!session) {
    return null;
  }

  const user = session.user as User;
  const isAdmin = user.role === "SUPER_ADMIN";

  const menuItems = [
    {
      label: "My Account",
      icon: UserIcon,
      href: "/account",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "My Orders",
      icon: Package,
      href: "/account/orders",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Wishlist",
      icon: Heart,
      href: "/account/wishlist",
      color: "text-pink-600",
      bg: "bg-pink-50",
      badge: wishlistCount,
    },
    {
      label: "Compare",
      icon: ArrowLeftRight,
      href: "/compare",
      color: "text-amber-600",
      bg: "bg-amber-50",
      badge: compareCount,
    },
    {
      label: "Offers & Deals",
      icon: Tag,
      href: "/sale",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  // Add Admin Dashboard if user is admin
  if (isAdmin) {
    menuItems.unshift({
      label: "Admin Dashboard",
      icon: Shield,
      href: "/admin",
      color: "text-rose-600",
      bg: "bg-rose-50",
    });
  }

  return (
    <>
      {/* Backdrop. Sits below the bottom bar so the bar stays lit while open. */}
      <div
        className={`fixed inset-0 z-1040 bg-black/50 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drop-up card, floating just above the bottom bar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={`fixed inset-x-2.5 bottom-[calc(78px+env(safe-area-inset-bottom,0px))] z-1070 mx-auto flex max-h-[calc(100dvh-150px)] max-w-lg origin-bottom flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_18px_50px_-12px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out md:hidden ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >

        {/* Header with User Info */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={44}
                    height={44}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg font-black text-indigo-600 bg-indigo-50">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full border border-white shadow-sm">
                  <BadgeCheck size={10} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900 truncate max-w-[140px]">
                  {user.name}
                </h3>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider rounded-md">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[170px]">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all active:scale-[0.99] group ${
                    isActive
                      ? "bg-[#EEF2FF] text-[#312E81] font-bold"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-white/80 text-[#312E81]"
                          : `${item.bg} ${item.color}`
                      }`}
                    >
                      <item.icon size={18} />
                    </div>
                    <span
                      className={`text-sm ${
                        isActive ? "text-[#312E81]" : "text-gray-700 font-semibold group-hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-black rounded-full transition-all ${
                      isActive
                        ? "bg-[#312E81] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all active:scale-[0.99] group bg-white hover:bg-red-50/30 text-left"
            >
              <div className="p-2 rounded-lg bg-red-50 text-red-600 transition-all group-hover:bg-red-100">
                <LogOut size={18} />
              </div>
              <span className="text-sm text-gray-700 font-semibold group-hover:text-red-600 transition-colors">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
