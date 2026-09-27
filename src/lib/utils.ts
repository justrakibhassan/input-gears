import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Sanitizes URLs to prevent XSS attacks (e.g. javascript:, data:, vbscript: pseudo-protocols).
 * Returns the URL if safe, or '#' if dangerous.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    const lower = trimmed.toLowerCase();
    if (
      !lower.startsWith("javascript:") &&
      !lower.startsWith("data:") &&
      !lower.startsWith("vbscript:")
    ) {
      return trimmed;
    }
  }
  return "#";
}

const KNOWN_SWATCH_COLORS: Record<string, string> = {
  black: "#18181b",
  "matte black": "#18181b",
  midnight: "#0f172a",
  white: "#f8fafc",
  "chalk white": "#f8fafc",
  platinum: "#e2e8f0",
  silver: "#cbd5e1",
  gray: "#6b7280",
  grey: "#6b7280",
  "space gray": "#374151",
  "space grey": "#374151",
  charcoal: "#1f2937",
  blue: "#3b82f6",
  navy: "#1e3a8a",
  "navy blue": "#1e3a8a",
  cyan: "#06b6d4",
  teal: "#0d9488",
  red: "#ef4444",
  crimson: "#dc2626",
  rose: "#f43f5e",
  pink: "#ec4899",
  purple: "#a855f7",
  violet: "#8b5cf6",
  lavender: "#c084fc",
  green: "#22c55e",
  emerald: "#10b981",
  forest: "#166534",
  "forest green": "#166534",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  coral: "#fb7185",
  gold: "#eab308",
  bronze: "#b45309",
};

export function getSwatchColorHex(color?: string | null): string {
  if (!color) return "#64748b";
  const normalized = color.toLowerCase().trim();
  if (KNOWN_SWATCH_COLORS[normalized]) {
    return KNOWN_SWATCH_COLORS[normalized];
  }
  for (const [key, hex] of Object.entries(KNOWN_SWATCH_COLORS)) {
    if (normalized.includes(key)) {
      return hex;
    }
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return normalized;
  }
  return "#475569";
}
