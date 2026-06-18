"use client";

import AccountSidebar from "@/modules/account/components/account-sidebar";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50/50 text-gray-900 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Sidebar Skeleton */}
            <div className="hidden md:block w-72 shrink-0">
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="h-4 w-24 bg-gray-100 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className="h-5 w-5 bg-gray-100 rounded-lg"></div>
                      <div className="h-4 w-32 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Main Content Skeleton */}
            <main className="flex-1 min-w-0">
              <div className="bg-white border border-gray-150 rounded-[32px] shadow-sm p-8 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-gray-100 rounded"></div>
                    <div className="h-3.5 w-32 bg-gray-100 rounded"></div>
                  </div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                  <div className="h-8 bg-gray-100 rounded-xl"></div>
                  <div className="h-24 bg-gray-100 rounded-xl"></div>
                  <div className="h-24 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isOverview = pathname === "/account";

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: Sidebar (Hidden on mobile) */}
          <div className="hidden md:block w-72 shrink-0">
            <div className="sticky top-24">
              <AccountSidebar user={session.user} />
            </div>
          </div>

          {/* Right Side: Dynamic Content */}
          <main className="flex-1 min-w-0">
            {!isOverview && (
              <div className="md:hidden mb-4">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-indigo-600 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-xs transition-all duration-200 active:scale-95 group"
                >
                  <ArrowLeft
                    size={14}
                    className="transition-transform group-hover:-translate-x-0.5 text-gray-400 group-hover:text-indigo-600"
                  />
                  <span>Back to Account</span>
                </Link>
              </div>
            )}
            <div
              className={
                isOverview
                  ? "bg-transparent"
                  : "bg-white border border-gray-150 rounded-[32px] shadow-sm text-gray-900"
              }
            >
              <Suspense
                fallback={
                  <div className="h-64 animate-pulse bg-gray-100/50 rounded-3xl" />
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
