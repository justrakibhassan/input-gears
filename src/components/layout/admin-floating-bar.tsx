"use client";

import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFloatingBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't render on admin dashboard pages
  if (pathname.startsWith("/admin")) return null;

  const userRole = (session?.user as { role?: string })?.role;
  const isAdminLike = userRole && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(userRole);
  if (!isAdminLike) return null;

  return (
    <div className="bg-neutral-900 text-white text-[11px] h-9 flex items-center justify-between px-4 sm:px-6 font-bold tracking-wider border-b border-white/10 z-[999] sticky top-0 no-print animate-in slide-in-from-top duration-300 select-none uppercase">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <UserCheck size={14} className="text-indigo-400 shrink-0" />
        <span>
          Staff Mode:{" "}
          <span className="text-indigo-400">
            {userRole?.replace("_", " ")}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors py-1 px-2.5 rounded-md hover:bg-white/5"
        >
          <LayoutDashboard size={13} className="shrink-0" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
