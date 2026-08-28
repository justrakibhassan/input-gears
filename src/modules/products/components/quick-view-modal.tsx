"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Heart,
  ArrowLeftRight,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
import { createPortal } from "react-dom";
import { getReviewStats } from "../../reviews/actions";
import { Product } from "@/types/product";

export interface QuickViewProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images?: string[];
  description: string | null;
  stock: number;
  slug: string;
  category?: {
    name: string;
  } | null;
  brand?: string | null;
  switchType?: string | null;
  isOnSale?: boolean;
  salePrice?: number | null;
  colors?: string[];
  specs?: Record<string, string | number | boolean | null> | null;
  connectionType?: string | null;
  sensor?: string | null;
  dpi?: string | null;
  weight?: string | null;
  pollingRate?: string | null;
  warranty?: string | null;
  availability?: string | null;
  sku?: string | null;
}

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | Product;
}

const COMMON_HEX_COLORS: Record<string, string> = {
  "#000000": "Black",
  "#000": "Black",
  "#ffffff": "White",
  "#fff": "White",
  "#ff0000": "Red",
  "#00ff00": "Green",
  "#0000ff": "Blue",
  "#ffff00": "Yellow",
  "#808080": "Gray",
  "#800080": "Purple",
  "#ffa500": "Orange",
  "#ffc0cb": "Pink",
  "#a52a2a": "Brown",
  "#1e293b": "Dark Slate",
  "#111827": "Matte Black",
  "#4f46e5": "Indigo",
  "#0f172a": "Midnight",
  "#f3f4f6": "Off-White",
  "#e2e8f0": "Platinum",
};

function getDisplayColorName(color: string | null): string {
  if (!color) return "";
  const trimmed = color.trim();
  const lower = trimmed.toLowerCase();
  if (COMMON_HEX_COLORS[lower]) {
    return COMMON_HEX_COLORS[lower];
  }
  if (lower.startsWith("#")) {
    return "Custom";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

interface ColorVariantMeta {
  image?: string;
  inStock?: boolean;
  price?: number;
  regularPrice?: number;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { data: session } = useSession();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Extract colorMap from specs safely
  const colorMap = useMemo<Record<string, ColorVariantMeta>>(() => {
    if (product.specs && typeof product.specs === "object") {
      const rawMap = (product.specs as Record<string, unknown>).colorMap;
      if (rawMap && typeof rawMap === "object") {
        return rawMap as Record<string, ColorVariantMeta>;
      }
    }
    return {};
  }, [product.specs]);

  // Gallery image list
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (colorMap && typeof colorMap === "object") {
      Object.values(colorMap).forEach((val) => {
        if (val && typeof val === "object" && val.image && !list.includes(val.image)) {
          list.push(val.image);
        }
      });
    }
    return list;
  }, [product.image, product.images, colorMap]);

  const validColors = useMemo(() => {
    if (!product?.colors || !Array.isArray(product.colors)) return [];
    return product.colors.filter((c) => typeof c === "string" && c.trim().length > 0);
  }, [product?.colors]);

  const [selectedImage, setSelectedImage] = useState<string | null>(
    allImages[0] || product.image || null,
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(
    validColors[0] || null,
  );

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const mapped = colorMap[color];
    if (mapped && typeof mapped === "object" && mapped.image && allImages.includes(mapped.image)) {
      setSelectedImage(mapped.image);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset states on open/product change
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAddedSuccess(false);
      setSelectedImage(allImages[0] || product.image || null);
      setSelectedColor(validColors[0] || null);

      if (product.id) {
        getReviewStats(product.id).then((res) => {
          if (res.success && res.data) {
            setRating(res.data.averageRating || 0);
            setReviewCount(res.data.totalReviews || 0);
          }
        });
      }
    }
  }, [isOpen, product, allImages]);

  // Close on ESC and manage body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isWishlisted = isMounted ? wishlist.isInWishlist(product.id) : false;
  const isComparing = isMounted ? compare.isInCompare(product.id) : false;

  const activeVariantMeta = selectedColor && colorMap[selectedColor] ? colorMap[selectedColor] : null;

  const isOutOfStock =
    activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.inStock !== undefined
      ? !activeVariantMeta.inStock
      : product.stock === 0;

  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock <= 5;

  const effectivePrice =
    activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.price
      ? activeVariantMeta.price
      : product.isOnSale && product.salePrice
        ? product.salePrice
        : product.price;

  const regularPrice =
    activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.regularPrice
      ? activeVariantMeta.regularPrice
      : product.price;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(effectivePrice);

  const originalPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(regularPrice);

  const discountPercentage =
    regularPrice > effectivePrice
      ? Math.round(((regularPrice - effectivePrice) / regularPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    setIsAdding(true);
    setTimeout(() => {
      cart.addItem(
        {
          id: product.id,
          name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`,
          slug: product.slug,
          price: effectivePrice,
          image: selectedImage || product.image || "",
          quantity: quantity,
          maxStock: product.stock,
        },
        !!session,
      );
      setIsAdding(false);
      setIsAddedSuccess(true);
      setTimeout(() => {
        setIsAddedSuccess(false);
      }, 2000);
    }, 400);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    cart.addItem(
      {
        id: product.id,
        name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`,
        slug: product.slug,
        price: effectivePrice,
        image: selectedImage || product.image || "",
        quantity: quantity,
        maxStock: product.stock,
      },
      !!session,
    );
    onClose();
    router.push("/cart");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggleItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        image: selectedImage || product.image || "",
        stock: isOutOfStock ? 0 : product.stock,
        category: product.category ? { name: product.category.name } : null,
      },
      !!session,
    );
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComparing) {
      compare.removeItem(product.id);
    } else {
      compare.addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        image: selectedImage || product.image || "",
        category: product.category as any,
        colors: product.colors || [],
        switchType: product.switchType || undefined,
        specs: product.specs,
        brand: product.brand,
        sku: product.sku,
        dpi: product.dpi,
        weight: product.weight,
        connectionType: product.connectionType,
        pollingRate: product.pollingRate,
        sensor: product.sensor,
        warranty: product.warranty,
        availability: product.availability,
      });
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto no-scrollbar">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card - Clean Neutral Theme */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto z-10 max-h-[92vh] md:max-h-[600px] border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (Independent top right) */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-3.5 right-3.5 z-40 p-2 rounded-full bg-white/95 text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-all border border-gray-200 shadow-2xs cursor-pointer"
            >
              <X size={17} strokeWidth={2.2} />
            </button>

            {/* LEFT COLUMN: Clean Image Gallery */}
            <div className="w-full md:w-[48%] bg-[#fafafc] p-4 sm:p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-gray-150 shrink-0">
              {/* Top Badges & Actions */}
              <div className="flex items-center justify-between gap-2 z-10 w-full mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {discountPercentage ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#65b045] text-white shadow-2xs">
                      -{discountPercentage}%
                    </span>
                  ) : isOutOfStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-900 text-white">
                      Sold Out
                    </span>
                  ) : null}

                  {product.brand && (
                    <span className="px-2.5 py-0.5 text-[10.5px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full shadow-2xs">
                      {product.brand}
                    </span>
                  )}
                </div>

                {/* Wishlist & Compare Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleWishlist}
                    aria-label={isWishlisted ? "In Wishlist" : "Add to wishlist"}
                    title={isWishlisted ? "In Wishlist" : "Wishlist"}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
                      isWishlisted
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-white text-gray-600 border-gray-200 hover:text-rose-600 hover:border-gray-300"
                    }`}
                  >
                    <Heart
                      size={14}
                      strokeWidth={2}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    onClick={handleToggleCompare}
                    aria-label={isComparing ? "In Compare" : "Compare"}
                    title={isComparing ? "In Compare" : "Compare"}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
                      isComparing
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <ArrowLeftRight size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Main Active Image Viewport */}
              <div className="group relative w-full aspect-square max-w-[260px] sm:max-w-[290px] mx-auto flex items-center justify-center py-2">
                {selectedImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={selectedImage}
                      alt={product.name}
                      fill
                      className={`object-contain transition-opacity duration-200 ${
                        isOutOfStock ? "opacity-35 grayscale" : "opacity-100"
                      }`}
                      sizes="(max-width: 640px) 260px, 290px"
                      priority
                    />
                  </div>
                ) : (
                  <div className="text-gray-300 text-xs italic font-medium">
                    No Image
                  </div>
                )}

                {/* Prev Slide Button */}
                {allImages.length > 1 && (
                  <button
                    onClick={() => {
                      const curIdx = allImages.indexOf(selectedImage || "");
                      const prevIdx = (curIdx - 1 + allImages.length) % allImages.length;
                      setSelectedImage(allImages[prevIdx]);
                    }}
                    aria-label="Previous image"
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7.5 w-7.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-950 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft size={16} strokeWidth={2.2} />
                  </button>
                )}

                {/* Next Slide Button */}
                {allImages.length > 1 && (
                  <button
                    onClick={() => {
                      const curIdx = allImages.indexOf(selectedImage || "");
                      const nextIdx = (curIdx + 1) % allImages.length;
                      setSelectedImage(allImages[nextIdx]);
                    }}
                    aria-label="Next image"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7.5 w-7.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-950 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                  >
                    <ChevronRight size={16} strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* Multi-image Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2 mt-auto overflow-x-auto no-scrollbar w-full">
                  {allImages.map((img, idx) => {
                    const isCurrent = selectedImage === img;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 bg-white ${
                          isCurrent
                            ? "border-gray-900 ring-2 ring-gray-900/20 shadow-2xs"
                            : "border-gray-200/90 opacity-65 hover:opacity-100 hover:border-gray-400"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-contain p-1"
                          sizes="40px"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Details & Quick Overview & Actions */}
            <div className="w-full md:w-[52%] p-4 sm:p-6 flex flex-col justify-between overflow-y-auto no-scrollbar bg-white">
              <div className="space-y-3">
                {/* Header: Category & Stock Status Pill (with pr-10 so never overlaps X button) */}
                <div className="flex items-center justify-between gap-2 pr-9">
                  {product.category?.name ? (
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {product.category.name}
                    </span>
                  ) : <div />}

                  <div>
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Only {product.stock} left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Title */}
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="block"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug tracking-tight line-clamp-2 hover:text-gray-700 transition-colors">
                      {product.name}
                    </h2>
                  </Link>
                </div>

                {/* Rating & Reviews + Price Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                      {formattedPrice}
                    </span>
                    {regularPrice > effectivePrice && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through tabular-nums font-normal">
                        {originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({reviewCount > 0 ? `${reviewCount}` : "9"})
                    </span>
                  </div>
                </div>

                {/* Color Variants (Only if valid colors are declared) */}
                {validColors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-gray-700">
                      Color:{" "}
                      <span className="text-gray-900 font-bold">
                        {getDisplayColorName(selectedColor || validColors[0])}
                      </span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {validColors.map((color, idx) => {
                        const isSelected =
                          (selectedColor || validColors[0]) === color;
                        const displayName = getDisplayColorName(color);
                        const variantMeta = colorMap[color];
                        const isOut = variantMeta && variantMeta.inStock === false;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectColor(color)}
                            aria-label={`Select color ${displayName}`}
                            title={`${displayName}${isOut ? " (Out of Stock)" : ""}`}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                            } ${isOut && !isSelected ? "opacity-60 bg-gray-50" : ""}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                              style={{
                                backgroundColor: color.toLowerCase().includes("white")
                                  ? "#ffffff"
                                  : color.toLowerCase().includes("blue")
                                    ? "#60a5fa"
                                    : color.toLowerCase().includes("red")
                                      ? "#ef4444"
                                      : color.toLowerCase().includes("gradient") || color.toLowerCase().includes("black")
                                        ? "#1f2937"
                                        : color.toLowerCase(),
                              }}
                            />
                            <span>{displayName}</span>
                            {isOut && <span className="text-[10px] opacity-75">(Out)</span>}
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Overview (Clean Concise Specs - What buyers need in Quick View!) */}
                <div className="space-y-1.5 pt-2 pb-1 border-t border-gray-150 text-xs text-gray-600">
                  <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Quick Overview:
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {product.specs && typeof product.specs === "object" && (product.specs as any).layout && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Layout:</strong> {String((product.specs as any).layout)}
                        </span>
                      </li>
                    )}
                    {product.specs && typeof product.specs === "object" && (product.specs as any).structure && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Structure:</strong> {String((product.specs as any).structure)}
                        </span>
                      </li>
                    )}
                    {product.connectionType && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Connectivity:</strong> {product.connectionType}
                        </span>
                      </li>
                    )}
                    {product.switchType && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Switches:</strong> {product.switchType}
                        </span>
                      </li>
                    )}
                    {product.specs && typeof product.specs === "object" && (product.specs as any).battery && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Battery:</strong> {String((product.specs as any).battery)}
                        </span>
                      </li>
                    )}
                    {product.warranty && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>
                          <strong className="text-gray-800">Warranty:</strong> {product.warranty}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Bottom Section */}
              <div className="pt-3 mt-2 border-t border-gray-150 space-y-2">
                {/* Stepper + Add to Cart + Buy Now Buttons */}
                <div className="flex items-center gap-2">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white shrink-0">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                      className="w-7 h-8.5 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <span className="w-7 text-center font-bold text-gray-900 text-xs tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock || 99, q + 1))
                      }
                      disabled={quantity >= (product.stock || 99) || isOutOfStock}
                      aria-label="Increase quantity"
                      className="w-7 h-8.5 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isOutOfStock}
                    className={`flex-1 h-8.5 sm:h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer ${
                      isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        : isAddedSuccess
                          ? "bg-gray-900 text-white"
                          : "bg-gray-900 text-white hover:bg-black"
                    }`}
                  >
                    {isOutOfStock ? (
                      <span>Sold Out</span>
                    ) : isAdding ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : isAddedSuccess ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check size={14} strokeWidth={2.5} />
                        Added
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <ShoppingCart size={14} strokeWidth={2} />
                        Add to Cart
                      </span>
                    )}
                  </button>

                  {/* Buy Now CTA */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 h-8.5 sm:h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center transition-all active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>

                {/* View Full Product Page Link & Trust Badges */}
                <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                      <Truck size={12} className="text-gray-400" /> Fast Dispatch
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                      <ShieldCheck size={12} className="text-gray-400" /> Genuine
                    </span>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 font-bold text-gray-900 hover:text-indigo-600 transition-colors ml-auto text-xs"
                  >
                    View Full Details
                    <ArrowUpRight size={13} strokeWidth={2.2} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
