"use client";

import { useQueryState, parseAsString } from "nuqs";
import { cn } from "@/lib/utils";

interface CustomerRoleFilterProps {
  counts?: {
    ALL: number;
    CUSTOMERS: number;
    STAFF: number;
    BANNED: number;
  };
}

const TABS = [
  { key: "", label: "All Users", countKey: "ALL" as const },
  { key: "USER", label: "Customers", countKey: "CUSTOMERS" as const },
  { key: "STAFF", label: "Staff & Admins", countKey: "STAFF" as const },
  { key: "BANNED", label: "Banned", countKey: "BANNED" as const },
];

export default function CustomerRoleFilter({ counts }: CustomerRoleFilterProps) {
  const [role, setRole] = useQueryState(
    "role",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      {TABS.map((tab) => {
        const isActive = role === tab.key;
        const count = counts ? counts[tab.countKey] : undefined;

        return (
          <button
            key={tab.key}
            onClick={() => setRole(tab.key || null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              isActive
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
            )}
          >
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  isActive
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
