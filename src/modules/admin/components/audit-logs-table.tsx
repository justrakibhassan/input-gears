"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ShieldAlert,
  Search,
  Calendar,
  ChevronDown,
  Copy,
  Download,
  User,
  Clock,
  Package,
  ShoppingBag,
  Tag,
  RotateCcw,
  FileText,
  Check,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AuditLog {
  id: string;
  adminId: string;
  admin?: {
    name?: string | null;
    email?: string | null;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: Date | string;
}

export type ActionCategoryOption = "ALL" | "CREATE" | "UPDATE" | "DELETE" | "OTHER";
export type DateRangeOption = "ALL" | "TODAY" | "7D" | "30D";

export interface AuditLogsTableProps {
  data?: AuditLog[] | null;
}

// Fallback demo audit trail if DB is currently clean
const demoAuditLogs: AuditLog[] = [
  {
    id: "log_01",
    adminId: "admin_01",
    admin: { name: "Rakib Hassan", email: "admin@inputgears.com" },
    action: "UPDATE_PRODUCT",
    entityType: "PRODUCT",
    entityId: "prod_keychron_q1_pro",
    details: "Updated stock from 12 to 24 and set sale price to $189.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 18), // 18 mins ago
  },
  {
    id: "log_02",
    adminId: "admin_01",
    admin: { name: "Rakib Hassan", email: "admin@inputgears.com" },
    action: "APPROVE_RETURN",
    entityType: "RETURN",
    entityId: "ret_99214_case",
    details: "Approved return request #RET-99214 for customer John Doe ($149.00)",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
  },
  {
    id: "log_03",
    adminId: "admin_02",
    admin: { name: "Sarah Jenkins", email: "sarah@inputgears.com" },
    action: "CREATE_COUPON",
    entityType: "COUPON",
    entityId: "cpn_flash_weekend",
    details: "Created coupon code 'FLASH25' with 25% discount, expiry 30 days",
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: "log_04",
    adminId: "admin_01",
    admin: { name: "Rakib Hassan", email: "admin@inputgears.com" },
    action: "UPDATE_ORDER_STATUS",
    entityType: "ORDER",
    entityId: "ord_884920",
    details: "Changed status from PROCESSING to SHIPPED. Tracking added.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: "log_05",
    adminId: "admin_02",
    admin: { name: "Sarah Jenkins", email: "sarah@inputgears.com" },
    action: "UPDATE_APPEARANCE",
    entityType: "APPEARANCE",
    entityId: "theme_hero_slide_01",
    details: "Replaced slide 1 banner image and updated headline copy.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14), // 14 hours ago
  },
  {
    id: "log_06",
    adminId: "admin_01",
    admin: { name: "Rakib Hassan", email: "admin@inputgears.com" },
    action: "DELETE_COUPON",
    entityType: "COUPON",
    entityId: "cpn_old_winter_sale",
    details: "Deleted expired coupon campaign 'WINTER10'",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28), // 1 day ago
  },
  {
    id: "log_07",
    adminId: "admin_03",
    admin: { name: "Alex Rivera", email: "alex@inputgears.com" },
    action: "UPDATE_CUSTOMER_ROLE",
    entityType: "USER",
    entityId: "usr_customer_8471",
    details: "Assigned staff role to customer profile alex.rivera@team.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: "log_08",
    adminId: "admin_01",
    admin: { name: "Rakib Hassan", email: "admin@inputgears.com" },
    action: "REFUND_ORDER",
    entityType: "ORDER",
    entityId: "ord_771924",
    details: "Issued partial refund of $45.00 via Stripe settlement",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
  },
];

export function AuditLogsTable({ data: initialData }: AuditLogsTableProps) {
  const logs = useMemo(() => {
    return initialData && initialData.length > 0 ? initialData : demoAuditLogs;
  }, [initialData]);

  // Filters State
  const [search, setSearch] = useState("");
  const [actionCategory, setActionCategory] = useState<ActionCategoryOption>("ALL");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRangeOption>("ALL");

  // Interactive Table State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Dynamic unique options
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.entityType) set.add(log.entityType.toUpperCase());
    });
    return Array.from(set);
  }, [logs]);

  const adminList = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((log) => {
      if (log.admin?.name) map.set(log.admin.name, log.admin.name);
    });
    return Array.from(map.keys());
  }, [logs]);

  // Summary Metrics
  const stats = useMemo(() => {
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    logs.forEach((l) => {
      const act = l.action.toUpperCase();
      if (act.includes("CREATE") || act.includes("ADD")) creates++;
      else if (act.includes("DELETE") || act.includes("REMOVE")) deletes++;
      else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("APPROVE") || act.includes("REFUND")) updates++;
    });
    return { creates, updates, deletes, total: logs.length };
  }, [logs]);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = (log.action || "").toUpperCase();
      const entity = (log.entityType || "").toUpperCase();
      const adminName = log.admin?.name || "";
      const adminEmail = log.admin?.email || "";
      const details = log.details || "";
      const entityId = log.entityId || "";

      // 1. Action Category Pill
      if (actionCategory === "CREATE" && !act.includes("CREATE") && !act.includes("ADD")) return false;
      if (actionCategory === "UPDATE" && !act.includes("UPDATE") && !act.includes("EDIT") && !act.includes("APPROVE") && !act.includes("REFUND")) return false;
      if (actionCategory === "DELETE" && !act.includes("DELETE") && !act.includes("REMOVE")) return false;
      if (
        actionCategory === "OTHER" &&
        (act.includes("CREATE") || act.includes("ADD") || act.includes("UPDATE") || act.includes("EDIT") || act.includes("APPROVE") || act.includes("REFUND") || act.includes("DELETE") || act.includes("REMOVE"))
      ) {
        return false;
      }

      // 2. Entity Type
      if (selectedEntity !== "ALL" && entity !== selectedEntity) return false;

      // 3. Admin
      if (selectedAdmin !== "ALL" && adminName !== selectedAdmin) return false;

      // 4. Date Range
      if (dateRange !== "ALL") {
        const logDate = new Date(log.createdAt).getTime();
        const now = Date.now();
        if (dateRange === "TODAY" && now - logDate > 1000 * 60 * 60 * 24) return false;
        if (dateRange === "7D" && now - logDate > 1000 * 60 * 60 * 24 * 7) return false;
        if (dateRange === "30D" && now - logDate > 1000 * 60 * 60 * 24 * 30) return false;
      }

      // 5. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          act.toLowerCase().includes(q) ||
          entity.toLowerCase().includes(q) ||
          adminName.toLowerCase().includes(q) ||
          adminEmail.toLowerCase().includes(q) ||
          details.toLowerCase().includes(q) ||
          entityId.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [logs, actionCategory, selectedEntity, selectedAdmin, dateRange, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV helper
  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    const headers = ["Timestamp", "Admin Name", "Admin Email", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((l) => [
      format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
      `"${l.admin?.name || ""}"`,
      `"${l.admin?.email || ""}"`,
      l.action,
      l.entityType,
      `"${l.entityId || ""}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredLogs.length} audit logs to CSV`);
  };

  const resetFilters = () => {
    setSearch("");
    setActionCategory("ALL");
    setSelectedEntity("ALL");
    setSelectedAdmin("ALL");
    setDateRange("ALL");
    setPage(1);
  };

  const hasActiveFilters = search || actionCategory !== "ALL" || selectedEntity !== "ALL" || selectedAdmin !== "ALL" || dateRange !== "ALL";

  // Action badge color styling
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REJECT")) {
      return {
        bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60",
        dot: "bg-rose-500",
      };
    }
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("APPROVE")) {
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60",
        dot: "bg-emerald-500",
      };
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("STATUS") || act.includes("REFUND")) {
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60",
        dot: "bg-blue-500",
      };
    }
    return {
      bg: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
      dot: "bg-gray-400",
    };
  };

  // Entity icon resolver
  const getEntityIcon = (entityType: string) => {
    const e = entityType.toUpperCase();
    if (e.includes("PRODUCT")) return <Package size={13} className="text-indigo-500" />;
    if (e.includes("ORDER")) return <ShoppingBag size={13} className="text-emerald-500" />;
    if (e.includes("RETURN")) return <RotateCcw size={13} className="text-amber-500" />;
    if (e.includes("COUPON")) return <Tag size={13} className="text-purple-500" />;
    if (e.includes("USER") || e.includes("CUSTOMER")) return <User size={13} className="text-blue-500" />;
    if (e.includes("APPEARANCE")) return <Sparkles size={13} className="text-pink-500" />;
    if (e.includes("SETTING")) return <Settings size={13} className="text-gray-500" />;
    return <Layers size={13} className="text-indigo-400" />;
  };

  const ACTION_TABS = [
    { key: "ALL" as const, label: "All Logs", count: stats.total },
    { key: "CREATE" as const, label: "Create", count: stats.creates },
    { key: "UPDATE" as const, label: "Update & Actions", count: stats.updates },
    { key: "DELETE" as const, label: "Delete", count: stats.deletes },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Admin Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Security audit trail and chronological history of administrative operations
            </p>
          </div>
        </div>

        {/* Right Side: Total, Create, Update, Delete Badges & Export CSV */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {stats.total}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Creates:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {stats.creates}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl shadow-2xs text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium">Updates:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {stats.updates}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 rounded-xl shadow-2xs text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <span className="text-rose-600 dark:text-rose-400 font-medium">Deletes:</span>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              {stats.deletes}
            </span>
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Export filtered logs to CSV"
          >
            <Download size={14} className="text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Action Filter Tabs & Multi-Criteria Row Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3.5 sm:p-4 shadow-2xs space-y-3.5">
        {/* Top row: Action Type Pills + Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {ACTION_TABS.map((tab) => {
              const isActive = actionCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActionCategory(tab.key);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                    isActive
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      isActive
                        ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search admin, action, details..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Bottom row: Multi-dimensional Select Filters & Reset Button */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-200/70 dark:border-gray-700">
              <Layers size={13} className="text-gray-400" />
              <span className="text-gray-500 font-medium text-[11px]">Entity:</span>
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Entities</option>
                {entityTypes.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-200/70 dark:border-gray-700">
              <User size={13} className="text-gray-400" />
              <span className="text-gray-500 font-medium text-[11px]">Actor:</span>
              <select
                value={selectedAdmin}
                onChange={(e) => {
                  setSelectedAdmin(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Admins</option>
                {adminList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-200/70 dark:border-gray-700">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-gray-500 font-medium text-[11px]">Timeframe:</span>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value as DateRangeOption);
                  setPage(1);
                }}
                className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Last 24 Hours</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Reset Filters / Matching Count */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-400 text-xs">
              Showing <strong>{filteredLogs.length}</strong> matching events
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Advanced Actionable Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5"></th>
                <th className="px-4 py-3.5">Administrator</th>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Operation Details</th>
                <th className="px-4 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-400 dark:text-gray-500">
                    <ShieldAlert size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No audit logs found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Try adjusting the search criteria or selected filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5"
                      >
                        <RotateCcw size={12} />
                        <span>Clear all filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const actionStyle = getActionBadge(log.action);
                  const logDate = new Date(log.createdAt);
                  const timeAgo = formatDistanceToNow(logDate, { addSuffix: true });
                  const initials = log.admin?.name
                    ? log.admin.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "AD";

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className={cn(
                        "transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50 cursor-pointer group",
                        isExpanded && "bg-indigo-50/20 dark:bg-indigo-950/20"
                      )}
                    >
                      {/* Chevron expand */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          className={cn(
                            "p-1 rounded-md text-gray-400 hover:text-indigo-600 transition-transform",
                            isExpanded && "rotate-180 text-indigo-600"
                          )}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </td>

                      {/* Admin Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                              {log.admin?.name || "System Admin"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {log.admin?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action Pill */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                            actionStyle.bg
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", actionStyle.dot)} />
                          {log.action}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                            {getEntityIcon(log.entityType)}
                            <span>{log.entityType}</span>
                          </span>
                          {log.entityId && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.entityId, log.id);
                              }}
                              className="text-[11px] font-mono text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-gray-800/60 px-1.5 py-0.5 rounded border border-gray-200/60 dark:border-gray-700 flex items-center gap-1 cursor-pointer"
                              title="Click to copy Entity ID"
                            >
                              <span className="max-w-[80px] truncate">{log.entityId}</span>
                              {copiedId === log.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details Snippet */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {format(logDate, "MMM d, HH:mm")}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {timeAgo}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Expandable Detailed Drawer Component */}
        {expandedId && (() => {
          const log = paginatedLogs.find((l) => l.id === expandedId);
          if (!log) return null;
          const logDate = new Date(log.createdAt);

          return (
            <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/60 p-5 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/80 dark:border-indigo-900/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                    Audit Event Payload & Inspection
                  </h3>
                  <span className="font-mono text-[11px] text-gray-400">ID: {log.id}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={13} />
                  <span>Exact Time: {format(logDate, "yyyy-MM-dd HH:mm:ss (O)")}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Admin info box */}
                <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Actor Account
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">{log.admin?.name || "System Admin"}</p>
                  <p className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">{log.admin?.email}</p>
                  <p className="text-[10px] text-gray-400 font-mono pt-1">Admin ID: {log.adminId}</p>
                </div>

                {/* Target Entity box */}
                <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Affected Entity
                  </p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    {getEntityIcon(log.entityType)}
                    <span>{log.entityType}</span>
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-gray-500 text-[11px]">Entity ID:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[11px]">
                      {log.entityId || "N/A"}
                    </span>
                    {log.entityId && (
                      <button
                        onClick={() => copyToClipboard(log.entityId, `drawer_${log.id}`)}
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Copy Entity ID"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Event Action box */}
                <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Action Category
                  </p>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{log.action}</p>
                  <p className="text-gray-400 text-[11px]">
                    Captured securely via server action middleware
                  </p>
                </div>
              </div>

              {/* Full details text block */}
              <div className="mt-3.5 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Full Details Payload
                </p>
                <p className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800 leading-relaxed whitespace-pre-wrap">
                  {log.details}
                </p>
              </div>
            </div>
          );
        })()}

        {/* 5. Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-400">
                (Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="px-3 py-1 font-bold text-gray-900 dark:text-white">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
