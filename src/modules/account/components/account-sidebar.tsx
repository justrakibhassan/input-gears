"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Package,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  MapPin,
  Heart,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";

interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

interface AccountSidebarProps {
  user: UserProps;
}

const menuItems = [
  {
    title: "Overview",
    href: "/account",
    icon: LayoutDashboard,
  },
  {
    title: "My Orders",
    href: "/account/orders",
    icon: Package,
  },
  {
    title: "Wishlist",
    href: "/account/wishlist",
    icon: Heart,
    badge: true,
  },
  {
    title: "Addresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    title: "Profile Settings",
    href: "/account/profile",
    icon: User,
  },
  {
    title: "Reviews",
    href: "/account/reviews",
    icon: Star,
  },
];

export default function AccountSidebar({ user }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const wishlist = useWishlist();
  const wishlistCount = wishlist.items.length;

  const isAdmin = user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "MANAGER";
  const isEditor = user?.role === "CONTENT_EDITOR";
  const canAccessAdmin = isAdmin || isManager || isEditor;

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Logged out successfully");
    router.push("/sign-in");
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm h-full overflow-hidden flex flex-col transition-all duration-300">
      {/* 1. Header Title */}
      <div className="px-6 pt-8 pb-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          My Account
        </h3>
      </div>

      {/* 2. Admin Switcher */}
      {canAccessAdmin && (
        <div className="px-4 pb-3">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-2xl shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all group"
          >
            <ShieldCheck
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            Admin Dashboard
          </Link>
        </div>
      )}

      {/* 3. Main Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 group",
                isActive
                  ? "bg-[#EEF2FF] text-[#312E81] shadow-sm font-bold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  className={cn(
                    isActive ? "text-[#312E81]" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && wishlistCount > 0 && (
                <span className={cn(
                  "h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-black rounded-full",
                  isActive
                    ? "bg-[#312E81] text-white"
                    : "bg-gray-100 text-gray-500"
                )}>
                  {wishlistCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Logout Button */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
