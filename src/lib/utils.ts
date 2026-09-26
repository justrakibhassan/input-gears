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
