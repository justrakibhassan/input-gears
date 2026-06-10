"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive: boolean; // Master Switch
  useSchedule: boolean; // New Prop: Schedule Mode On/Off
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
}

type BadgeStatus = "live" | "scheduled" | "expired" | "inactive" | "permanent";

const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

export default function StatusBadge({
  isActive,
  useSchedule,
  startDate,
  endDate,
  className,
}: StatusBadgeProps) {
  const [status, setStatus] = useState<BadgeStatus>("inactive");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateStatus = () => {
      // 1. Master Switch OFF
      if (!isActive) {
        setStatus("inactive");
        return;
      }

      // 2. Master Switch ON, but Schedule OFF -> Permanent Active
      if (!useSchedule) {
        setStatus("permanent");
        return;
      }

      // 3. Schedule Logic
      const now = new Date();
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // Future
      if (start && now < start) {
        setStatus("scheduled");
        const diff = start.getTime() - now.getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (diff < oneDay) {
          setMessage(`Starts in ${formatDuration(diff)}`);
        } else {
          setMessage(
            `Starts ${start.toLocaleDateString()} ${start.toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            )}`
          );
        }
        return;
      }

      // Expired
      if (end && now > end) {
        setStatus("expired");
        return;
      }

      // Live (Running on Schedule)
      setStatus("live");
      if (end) {
        const diff = end.getTime() - now.getTime();
        setMessage(`Ends in ${formatDuration(diff)}`);
      } else {
        setMessage("Running");
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [isActive, useSchedule, startDate, endDate]);

  // --- UI ---

  if (status === "inactive") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap", className)}>
        <Ban size={12} /> DISABLED
      </div>
    );
  }

  if (status === "permanent") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap", className)}>
        <CheckCircle2 size={12} /> ALWAYS ACTIVE
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap", className)}>
        <AlertCircle size={12} /> EXPIRED
      </div>
    );
  }

  if (status === "scheduled") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap", className)}>
        <CalendarClock size={12} /> {message}
      </div>
    );
  }

  // Live (Scheduled)
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      LIVE <span className="text-emerald-400">|</span> {message}
    </div>
  );
}
