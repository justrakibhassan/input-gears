"use client";

import React from "react";
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Box,
  Calendar,
  Search,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StockLog {
  id: string;
  productId: string;
  product: {
    name: string;
    image: string | null;
  };
  user: {
    name: string;
  } | null;
  oldStock: number;
  newStock: number;
  change: number;
  reason: string | null;
  createdAt: Date | string;
}

interface StockLogsViewProps {
  logs: StockLog[];
}

export default function StockLogsView({ logs }: StockLogsViewProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <History className="text-indigo-600" size={24} />
            Stock History Log
          </h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Tracking every inventory adjustment
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-b border-gray-50 dark:border-gray-800">
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                Product
              </th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                Adjustment
              </th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                Details
              </th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                Admin
              </th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="group hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 overflow-hidden relative shrink-0">
                        {log.product.image ? (
                          <Image
                            src={log.product.image}
                            alt={log.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Box size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                          {log.product.name}
                        </span>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                          ID: {log.productId.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          log.change > 0
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        )}
                      >
                        {log.change > 0 ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                        {log.change > 0 ? "+" : ""}
                        {log.change}
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {log.oldStock} → {log.newStock}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                      {log.reason || "No reason provided"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <User size={14} />
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {log.user?.name || "System"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} className="text-indigo-400" />
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <History size={48} className="text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                      No stock logs found
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
