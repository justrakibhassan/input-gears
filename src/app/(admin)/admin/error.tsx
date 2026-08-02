"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, LayoutDashboard } from "lucide-react";

/**
 * Admin error boundary. Keeps the sidebar/chrome from the admin layout intact
 * and only replaces the failed page content.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Dashboard error
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          This section failed to load. Your data is safe — retry, or head back
          to the dashboard.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Ref: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <RotateCw
              size={14}
              className="transition-transform group-hover:rotate-90"
            />
            Try again
          </button>
          <Link
            href="/admin"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-all hover:border-indigo-300 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-300"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
