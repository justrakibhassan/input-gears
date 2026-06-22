"use client";

import { useState, useSyncExternalStore, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useAdminTheme } from "@/store/use-admin-theme";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  List,
  LogOut,
  Layers,
  Loader2,
  Paintbrush,
  Zap,
  Star,
  X,
  ClipboardList,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@prisma/client";

const emptySubscribe = () => () => {};

const sidebarGroups: {
  group: string;
  items: {
    title: string;
    href: string;
    icon: LucideIcon;
    roles: UserRole[];
  }[];
}[] = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"],
      },
    ],
  },
  {
    group: "Manage Product",
    items: [
      {
        title: "All Products",
        href: "/admin/products",
        icon: List,
        roles: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"],
      },
      {
        title: "Add New",
        href: "/admin/products/create",
        icon: PackagePlus,
        roles: ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"],
      },
      {
        title: "Categories",
        href: "/admin/categories",
        icon: Layers,
        roles: ["SUPER_ADMIN", "CONTENT_EDITOR"],
      },
      { title: "Reviews", href: "/admin/reviews", icon: Star, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    group: "Manage Order",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ShoppingBag,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        title: "Abandoned Carts",
        href: "/admin/abandoned-carts",
        icon: ShoppingBag,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        title: "Customers",
        href: "/admin/customers",
        icon: Users,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
  {
    group: "Store Front",
    items: [
      {
        title: "Appearance",
        icon: Paintbrush,
        href: "/admin/appearance",
        roles: ["SUPER_ADMIN", "CONTENT_EDITOR"],
      },
    ],
  },
  {
    group: "Settings",
    items: [
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Media Library",
        href: "/admin/media",
        icon: ImageIcon,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { compactSidebar, setCompactSidebar, sidebarColor, accentColor } = useAdminTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: UserRole })?.role;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isCollapsed = mounted ? compactSidebar : false;
  const currentSidebarColor = mounted ? sidebarColor : "#111827";
  const currentAccentColor = mounted ? accentColor : "#4f46e5";

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      toast.success("Logged out successfully");
      router.replace("/sign-in");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Failed to log out");
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      style={{ backgroundColor: currentSidebarColor }}
      className={cn(
        "h-screen h-dvh text-white transition-all duration-300 flex flex-col border-r border-white/10 z-[9999] lg:z-50",
        isCollapsed ? "w-20" : "w-72",
        "fixed lg:sticky top-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* 1. Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-white/10 relative shrink-0">
        {isCollapsed ? (
          <div 
            style={{ backgroundColor: currentAccentColor }}
            className="text-white p-1.5 rounded-lg shadow-lg dark:shadow-none"
          >
            <Zap size={20} fill="currentColor" />
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2 group">
            <div 
              style={{ backgroundColor: currentAccentColor }}
              className="text-white p-1.5 rounded-lg transform group-hover:rotate-10 transition-all duration-300"
            >
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              INPUT<span style={{ color: currentAccentColor }} className="font-black">GEARS</span>
            </span>
          </Link>
        )}

        {/* Collapse Button (Hidden on Mobile) */}
        <button
          onClick={() => setCompactSidebar(!isCollapsed)}
          style={{ backgroundColor: currentAccentColor }}
          className="absolute -right-3 top-6 rounded-full p-1 text-white shadow-lg dark:shadow-none transition-colors z-50 hidden lg:block hover:brightness-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Close Button (Mobile Only) */}
        <button
          onClick={onClose}
          className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* 2. Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-2 scrollbar-hide">
        {sidebarGroups.map((group, groupIdx) => {
          const visibleItems = isMounted ? group.items.filter((item) =>
            userRole && item.roles.includes(userRole)
          ) : [];

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="mb-4">
              {!isCollapsed && (
                <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4 opacity-50">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item, idx) => {
                const isActive = item.href ? pathname === item.href : false;

                return (
                  <Link
                    key={idx}
                    href={item.href!}
                    onClick={onClose}
                    style={isActive ? { backgroundColor: currentAccentColor } : {}}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all group relative",
                      isActive
                        ? "text-white shadow-lg dark:shadow-none"
                        : "text-gray-400 hover:bg-white/10 hover:text-white",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                      )}
                    />

                    {!isCollapsed && <span>{item.title}</span>}

                    {isCollapsed && (
                      <div className="absolute left-full ml-6 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-[100] shadow-xl">
                        {item.title}
                        <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-700" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      </nav>

      {/* 3. Footer / Logout */}
      <div className="p-4 pb-safe border-t border-white/10 shrink-0 bg-transparent">
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            isCollapsed && "justify-center px-2"
          )}
        >
          {isLoggingOut ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} />
          )}

          {!isCollapsed && (isLoggingOut ? "Signing out..." : "Sign Out")}
        </button>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </aside>
  );
}
