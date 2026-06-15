"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  BadgeCheck,
  CreditCard,
} from "lucide-react";
import Image from "next/image";

interface UserNavProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role?: string | null;
    };
  };
}

export default function UserNav({ session }: UserNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Logged out successfully");

          const protectedRoutes = [
            "/dashboard",
            "/account",
            "/settings",
            "/billing",
            "/admin",
          ];
          const isOnProtectedRoute = protectedRoutes.some((route) =>
            pathname.startsWith(route)
          );

          if (isOnProtectedRoute) {
            router.push("/sign-in");
          } else {
            router.refresh();
          }
        },
      },
    });
  };

  const isAdminLike = session.user.role && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(session.user.role);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button - Simple Avatar Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open user menu"
        className={`flex items-center justify-center h-10 w-10 rounded-full border transition-all duration-300 ${
          isOpen
            ? "bg-indigo-50 border-indigo-200 ring-4 ring-indigo-50"
            : "bg-white border-gray-100 hover:border-indigo-200 hover:bg-gray-50 shadow-sm"
        }`}
      >
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200/50 overflow-hidden relative">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-indigo-600" />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100 ring-1 ring-black/5 overflow-hidden z-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top-right">
          <div className="p-5 bg-linear-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-gray-900 truncate">
                {session.user.name}
              </p>
              {isAdminLike && (
                <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-600/10" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate font-medium">
              {session.user.email}
            </p>
          </div>

          <div className="p-2 space-y-0.5">
            {isAdminLike && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
              >
                <LayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/account/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
            >
              <CreditCard className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
              My Orders
            </Link>

            <div className="h-px bg-gray-50 my-1.5 mx-2" />

            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
            >
              <User className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
              My Account
            </Link>

            <div className="h-px bg-gray-50 my-1.5 mx-2" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-all group"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
