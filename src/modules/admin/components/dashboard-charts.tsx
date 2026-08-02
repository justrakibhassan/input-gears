"use client";

import React, { useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

const emptySubscribe = () => () => {};

// --- Sub-Components ---

/**
 * Revenue area chart. Renders exactly what it's given — an empty result means
 * an empty state, never a stand-in dataset, so a broken query can't be mistaken
 * for a healthy week of sales.
 */
const demoRevenueData = [
  { name: "Mon", revenue: 4200 },
  { name: "Tue", revenue: 3800 },
  { name: "Wed", revenue: 5500 },
  { name: "Thu", revenue: 2900 },
  { name: "Fri", revenue: 1950 },
  { name: "Sat", revenue: 6200 },
  { name: "Sun", revenue: 4800 },
];

export function RevenueChart({
  data = [],
}: {
  data?: { name: string; revenue: number }[];
}) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const displayData = data.length > 0 ? data : demoRevenueData;

  if (!isMounted) return <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 animate-pulse rounded-[24px]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#F3F4F6"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4F46E5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * Traffic breakdown donut. There is no analytics pipeline behind this yet, so
 * the caller supplies the slices — today that's the demo fixture, and the card
 * is hidden entirely when demo mode is off.
 */
export function TrafficDonutChart({
  data = [
    { name: "Direct", value: 45, color: "#4F46E5" },
    { name: "Social", value: 30, color: "#06B6D4" },
    { name: "Organic", value: 15, color: "#F59E0B" },
    { name: "Referral", value: 10, color: "#EC4899" },
  ],
  centerLabel = "12k",
}: {
  data?: { name: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) return <div className="h-[200px] w-full bg-gray-50 dark:bg-gray-800/50 animate-pulse rounded-full" />;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-[200px] w-full relative"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={8}
            dataKey="value"
            animationBegin={500}
            animationDuration={1000}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-black text-gray-900 dark:text-white">
          {centerLabel}
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Visits
        </span>
      </div>
    </motion.div>
  );
}
