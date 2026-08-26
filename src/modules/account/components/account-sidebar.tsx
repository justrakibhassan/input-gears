"use client";

import Link from "next/link";
import Image from "next/image";
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
    title: "My Reviews",
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
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* 1. User Profile Header Mini */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={44}
              height={44}
              className="object-cover h-full w-full"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {user.name}
          </h4>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* 2. Admin Switcher */}
      {canAccessAdmin && (
        <div className="px-3 pt-3">
          <Link
            href="/admin"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-xl hover:bg-indigo-100/70 transition-all group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>Admin Dashboard</span>
            </div>
            <span className="text-[10px] uppercase font-black bg-indigo-200/60 px-1.5 py-0.5 rounded text-indigo-800">
              Admin
            </span>
          </Link>
        </div>
      )}

      {/* 3. Main Navigation */}
      <nav className="p-3 space-y-1">
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
                "flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  className={cn(
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && wishlistCount > 0 && (
                <span
                  className={cn(
                    "h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Logout Button */}
      <div className="p-3 mt-auto border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
