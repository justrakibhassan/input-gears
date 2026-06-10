"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminSearchProps {
  placeholder?: string;
  queryKey?: string;
}

export default function AdminSearch({
  placeholder = "Search...",
  queryKey = "q",
}: AdminSearchProps) {
  const [query, setQuery] = useQueryState(
    queryKey,
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, throttleMs: 300 })
  );
  const [inputValue, setInputValue] = useState(query);
  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    setQuery(debouncedValue || null);
  }, [debouncedValue, setQuery]);

  return (
    <div className="relative max-w-sm w-full font-sans">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            setQuery(null);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
