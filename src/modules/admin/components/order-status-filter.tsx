"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Filter } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrderStatusFilter() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors relative">
      <Filter size={16} className="text-gray-400" />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value || null)}
        className="bg-transparent outline-none cursor-pointer pr-4 appearance-none"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
