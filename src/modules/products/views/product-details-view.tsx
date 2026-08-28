"use client";

import { useState, useMemo, useSyncExternalStore, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Product } from "../types";
import ProductTabs from "../components/product-tabs";
import RelatedProducts from "../components/related-products";
import {
  ShoppingCart,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Home,
  Facebook,
  MessageCircle,
  Link2,
  Bookmark,
  ArrowLeftRight,
  Settings,
  Truck,
  ShieldCheck,
  Store,
  X,
  Star,
} from "lucide-react";

interface ProductDetailsViewProps {
  product: Product;
  relatedProducts: Product[];
  averageRating: number;
  totalReviews: number;
}

// Helper to convert hex colors or raw strings into user-friendly names
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

const ProductDetailsView = memo(
  ({
    product,
    relatedProducts,
    averageRating,
    totalReviews,
  }: ProductDetailsViewProps) => {
    const cart = useCart();
    const wishlist = useWishlist();
    const compare = useCompare();
    const { data: session } = useSession();
    const userRole = (session?.user as { role?: string })?.role;
    const router = useRouter();

    const isMounted = useSyncExternalStore(
      () => () => {},
      () => true,
      () => false
    );

    // Extract color mapping from specs if available safely
    const colorMap = useMemo<Record<string, ColorVariantMeta>>(() => {
      if (product.specs && typeof product.specs === "object") {
        const rawMap = (product.specs as Record<string, unknown>).colorMap;
        if (rawMap && typeof rawMap === "object") {
          return rawMap as Record<string, ColorVariantMeta>;
        }
      }
      return {};
    }, [product.specs]);

    const allImages = useMemo(() => {
      const list: string[] = [];
      if (product.image && typeof product.image === "string" && product.image.trim().length > 0) {
        list.push(product.image);
      }
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img) => {
          if (img && typeof img === "string" && img.trim().length > 0 && !list.includes(img)) {
            list.push(img);
          }
        });
      }
      // If no images exist in product.image/images, fallback to colorMap images
      if (list.length === 0 && colorMap && typeof colorMap === "object") {
        Object.values(colorMap).forEach((val) => {
          if (val && typeof val === "object" && val.image && typeof val.image === "string" && val.image.trim().length > 0 && !list.includes(val.image)) {
            list.push(val.image);
          }
        });
      }
      if (list.length === 0) list.push("/placeholder.png");
      return list;
    }, [product.image, product.images, colorMap]);

    const validColors = useMemo(() => {
      if (!product.colors || !Array.isArray(product.colors)) return [];
      return product.colors.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
    }, [product.colors]);

    const rawSpecs = useMemo(() => {
      return (product.specs && typeof product.specs === "object" ? product.specs : {}) as Record<string, unknown>;
    }, [product.specs]);

    const [prevProduct, setPrevProduct] = useState(product);
    const [selectedImage, setSelectedImage] = useState(allImages[0]);
    const [selectedColor, setSelectedColor] = useState<string | null>(
      validColors[0] || null
    );
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddedSuccess, setIsAddedSuccess] = useState(false);

    if (prevProduct !== product) {
      setPrevProduct(product);
      setSelectedImage(allImages[0]);
      setSelectedColor(validColors[0] || null);
    }

    // Handle Color Change with automatic slider image update
    const handleSelectColor = (color: string | null) => {
      setSelectedColor(color);
      if (!color) return;

      // Check if this color has a mapped image
      const mapped = colorMap[color];
      if (mapped && typeof mapped === "object" && mapped.image && allImages.includes(mapped.image)) {
        setSelectedImage(mapped.image);
      }
    };

    // Calculate dynamic pricing based on variant or product sale
    const activeVariantMeta = selectedColor && colorMap[selectedColor] ? colorMap[selectedColor] : null;

    const effectivePrice = useMemo(() => {
      if (activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.price) {
        return activeVariantMeta.price;
      }
      return product.isOnSale && product.salePrice ? product.salePrice : (product.price || 0);
    }, [activeVariantMeta, product.isOnSale, product.salePrice, product.price]);

    const regularPrice = useMemo(() => {
      if (activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.regularPrice) {
        return activeVariantMeta.regularPrice;
      }
      return product.price || 0;
    }, [activeVariantMeta, product.price]);

    const formattedPrice = useMemo(() => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(effectivePrice);
    }, [effectivePrice]);

    const discountedPrice = useMemo(() => {
      if (product.isOnSale && regularPrice > effectivePrice) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(regularPrice);
      }
      return null;
    }, [regularPrice, effectivePrice, product.isOnSale]);

    const discountPercentage = useMemo(() => {
      if (regularPrice > effectivePrice) {
        return Math.round(((regularPrice - effectivePrice) / regularPrice) * 100);
      }
      return null;
    }, [regularPrice, effectivePrice]);

    // Variant stock check
    const isVariantOutOfStock = useMemo(() => {
      if (activeVariantMeta && typeof activeVariantMeta === "object" && activeVariantMeta.inStock !== undefined) {
        return !activeVariantMeta.inStock;
      }
      return product.stock === 0;
    }, [activeVariantMeta, product.stock]);

    // Slide Image Navigation Handlers
    const currentImageIndex = useMemo(() => {
      const idx = allImages.indexOf(selectedImage);
      return idx >= 0 ? idx : 0;
    }, [allImages, selectedImage]);

    const handlePrevImage = () => {
      if (allImages.length <= 1) return;
      const prevIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
      const targetImg = allImages[prevIndex];
      setSelectedImage(targetImg);

      // Auto-select corresponding color if mapped
      const foundColor = Object.keys(colorMap).find(
        (c) => colorMap[c] && colorMap[c].image === targetImg,
      );
      if (foundColor) setSelectedColor(foundColor);
    };

    const handleNextImage = () => {
      if (allImages.length <= 1) return;
      const nextIndex = (currentImageIndex + 1) % allImages.length;
      const targetImg = allImages[nextIndex];
      setSelectedImage(targetImg);

      // Auto-select corresponding color if mapped
      const foundColor = Object.keys(colorMap).find(
        (c) => colorMap[c] && colorMap[c].image === targetImg,
      );
      if (foundColor) setSelectedColor(foundColor);
    };

    const isWishlisted = isMounted && product?.id ? wishlist.isInWishlist(product.id) : false;
    const isComparing = isMounted && product?.id ? compare.isInCompare(product.id) : false;

    // Quantity Handlers
    const incrementQty = () =>
      setQuantity((prev) => (prev < (product?.stock || 99) ? prev + 1 : prev));
    const decrementQty = () =>
      setQuantity((prev) => (prev > 1 ? prev - 1 : prev));

    const handleToggleWishlist = () => {
      if (!product) return;
      wishlist.toggleItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: effectivePrice,
          image: selectedImage || product.image || "/placeholder.png",
          stock: isVariantOutOfStock ? 0 : product.stock,
          category: product.category ? { name: product.category.name } : null,
        },
        !!session,
      );
    };

    const handleToggleCompare = () => {
      if (!product) return;
      if (isComparing) {
        compare.removeItem(product.id);
      } else {
        compare.addItem({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: effectivePrice,
          image: selectedImage || product.image || "/placeholder.png",
          category: product.category
            ? ({
                id: "id" in product.category && typeof product.category.id === "string" ? product.category.id : "",
                name: product.category.name,
                slug: "slug" in product.category && typeof product.category.slug === "string" ? product.category.slug : "",
                description: null,
                image: null,
                parentId: null,
                isActive: true,
                isFeatured: false,
                seoTitle: null,
                seoDescription: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as import("@/types/product").Category)
            : null,
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

    const handleAddToCart = () => {
      if (!product || isVariantOutOfStock || product.stock === 0) return;
      setIsAdding(true);

      setTimeout(() => {
        cart.addItem(
          {
            id: product.id,
            name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`,
            slug: product.slug,
            price: effectivePrice,
            image: selectedImage || product.image || "/placeholder.png",
            quantity: quantity,
            maxStock: product.stock,
          },
          !!session,
        );

        setIsAdding(false);
        setIsAddedSuccess(true);
        setTimeout(() => setIsAddedSuccess(false), 2000);
      }, 400);
    };

    const handleBuyNow = () => {
      if (!product || isVariantOutOfStock || product.stock === 0) return;
      cart.addItem(
        {
          id: product.id,
          name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`,
          slug: product.slug,
          price: effectivePrice,
          image: selectedImage || product.image || "/placeholder.png",
          quantity: quantity,
          maxStock: product.stock,
        },
        !!session,
      );
      router.push("/cart");
    };

    const handleCopyLink = () => {
      if (typeof window !== "undefined") {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    };

    if (!product) return null;

    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 lg:py-8">
          {/* Breadcrumbs & Admin Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 sm:mb-6 pb-2.5 sm:pb-3 border-b border-gray-100">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-500 overflow-x-auto no-scrollbar"
            >
              <Link
                href="/"
                className="hover:text-gray-900 transition-colors flex items-center gap-1 shrink-0"
              >
                <Home size={13} className="shrink-0" />
                <span>Home</span>
              </Link>
              <span className="text-gray-300">/</span>
              {product.category && (
                <>
                  <Link
                    href={`/${product.category.slug}`}
                    className="hover:text-gray-900 transition-colors shrink-0"
                  >
                    {product.category.name}
                  </Link>
                  <span className="text-gray-300">/</span>
                </>
              )}
              {product.brand && (
                <>
                  <span className="text-gray-600 shrink-0 font-medium">{product.brand}</span>
                  <span className="text-gray-300">/</span>
                </>
              )}
              <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-none">
                {product.name}
              </span>
            </nav>

            {isMounted &&
              userRole &&
              ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(
                userRole,
              ) && (
                <Link
                  href={`/admin/products/edit/${product.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-full text-xs font-semibold transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Settings size={12} />
                  <span>Edit Product</span>
                </Link>
              )}
          </div>

          {/* --- HERO 3-PANEL / RESPONSIVE LAYOUT (Gallery, Center Info, Right Delivery Card) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-start mb-8 sm:mb-12 lg:mb-16">
            {/* 1. LEFT: IMAGE GALLERY WITH SLIDE NAVIGATION & THUMBNAILS (4.5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
              <div className="group relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-50/70 border border-gray-200/80 flex items-center justify-center p-4 sm:p-8">
                <Image
                  src={selectedImage || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-contain p-4 sm:p-6 transition-transform duration-300"
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                />

                {/* Minimalist Promotional / Status Badge */}
                <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 pointer-events-none">
                  {discountPercentage ? (
                    <span className="px-2.5 py-0.5 bg-[#5fae46] text-white rounded-full text-[10.5px] sm:text-[11px] font-bold tracking-tight shadow-2xs">
                      -{discountPercentage}%
                    </span>
                  ) : isVariantOutOfStock ? (
                    <span className="px-2.5 py-0.5 bg-gray-900 text-white rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider">
                      Sold Out
                    </span>
                  ) : null}
                </div>

                {/* Previous Image Slide Button (< - Always accessible on mobile, hover on desktop) */}
                {allImages.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-200 cursor-pointer opacity-90 md:opacity-0 md:group-hover:opacity-100 active:scale-95"
                  >
                    <ChevronLeft size={18} strokeWidth={2.2} />
                  </button>
                )}

                {/* Next Image Slide Button (> - Always accessible on mobile, hover on desktop) */}
                {allImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-200 cursor-pointer opacity-90 md:opacity-0 md:group-hover:opacity-100 active:scale-95"
                  >
                    <ChevronRight size={18} strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* Thumbnails Row (Clean rounded cards) */}
              {allImages.length > 1 && (
                <div className="flex gap-2 sm:gap-2.5 justify-start overflow-x-auto pb-1 no-scrollbar">
                  {allImages.map((img: string, index: number) => {
                    const isCurrent = selectedImage === img;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedImage(img);
                          const foundColor = Object.keys(colorMap).find(
                            (c) => colorMap[c] && colorMap[c].image === img,
                          );
                          if (foundColor) setSelectedColor(foundColor);
                        }}
                        aria-label={`View product image ${index + 1}`}
                        className={cn(
                          "relative h-14 w-14 sm:h-18 sm:w-18 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-200 bg-white cursor-pointer",
                          isCurrent
                            ? "border-indigo-600 ring-2 ring-indigo-600/30 shadow-xs"
                            : "border-gray-200/90 opacity-70 hover:opacity-100 hover:border-gray-400",
                        )}
                      >
                        <Image
                          src={img}
                          alt="Thumbnail"
                          fill
                          className="object-contain p-1 sm:p-1.5"
                          sizes="72px"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fast Delivery Pill Banner */}
              <div className="w-full rounded-2xl bg-[#a31c1c] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="space-y-0.5 text-xs font-semibold leading-tight">
                  <p className="text-white font-bold text-xs sm:text-[13px]">
                    Fast delivery within 24-48 Hours
                  </p>
                  <p className="text-[10.5px] text-white/80 font-normal">
                    (Depending on location)
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[10.5px] font-bold text-white shrink-0">
                  <Truck size={12} />
                  <span>Express</span>
                </div>
              </div>
            </div>

            {/* 2. CENTER: PRODUCT INFO, COLOR VARIANT & ACTIONS (4.5 Cols) */}
            <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">
              {/* Title & Brand */}
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug tracking-tight">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Brand: <span className="text-gray-900 font-semibold">{product.brand}</span>
                  </p>
                )}
              </div>

              {/* Price Row (Dark Bold Price Matching Screenshot) */}
              <div className="flex items-baseline gap-2.5 flex-wrap pt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                  {formattedPrice}
                </span>
                {discountedPrice && (
                  <span className="text-sm sm:text-base text-gray-400 line-through tabular-nums font-normal">
                    {discountedPrice}
                  </span>
                )}
              </div>

              {/* Rating Stars & Reviews Count */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < Math.round(averageRating || 5) ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  ({totalReviews > 0 ? `${totalReviews} customer reviews` : "9 customer reviews"})
                </span>
              </div>

              {/* Quick Overview (Clean Minimal Specs List) */}
              <div className="space-y-2 pt-3 border-t border-gray-150 text-xs sm:text-sm text-gray-600">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Quick Overview:
                </h3>
                <ul className="space-y-1.5 font-normal">
                  {rawSpecs.layout != null && typeof rawSpecs.layout !== "object" && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-gray-800">Layout:</strong> {String(rawSpecs.layout)}
                      </span>
                    </li>
                  )}
                  {rawSpecs.structure != null && typeof rawSpecs.structure !== "object" && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-gray-800">Structure:</strong> {String(rawSpecs.structure)}
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
                  {product.pollingRate && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-gray-800">Polling Rate:</strong> {product.pollingRate}
                      </span>
                    </li>
                  )}
                  {product.switchType && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-gray-800">Sensor/Switches:</strong> {product.switchType}
                      </span>
                    </li>
                  )}
                  {rawSpecs.battery != null && typeof rawSpecs.battery !== "object" && (
                    <li className="flex items-start gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span>
                        <strong className="text-gray-800">Battery:</strong> {String(rawSpecs.battery)}
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

              {/* COLOR / VARIANT SELECTOR WITH DROPDOWN + PILLS (Only shown if valid colors are declared) */}
              {validColors.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-gray-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-semibold">
                      Color:{" "}
                      <span className="text-indigo-600 font-bold">
                        {selectedColor ? getDisplayColorName(selectedColor) : "Choose an option"}
                      </span>
                    </span>
                    {selectedColor && (
                      <button
                        onClick={() => handleSelectColor(null)}
                        className="text-[11px] text-gray-400 hover:text-rose-600 transition flex items-center gap-0.5 cursor-pointer"
                      >
                        <X size={12} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Dropdown / Swatch Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    {validColors.map((color) => {
                      const isSelected = selectedColor === color;
                      const displayName = getDisplayColorName(color);
                      const variantMeta = colorMap && typeof colorMap === "object" ? colorMap[color] : null;
                      const isOut = variantMeta && typeof variantMeta === "object" && variantMeta.inStock === false;

                      return (
                        <button
                          key={color}
                          onClick={() => handleSelectColor(color)}
                          aria-label={`Select color ${displayName}`}
                          title={`${displayName}${isOut ? " (Out of Stock)" : ""}`}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300",
                            isOut && !isSelected && "opacity-60 bg-gray-50",
                          )}
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
                          {isSelected && <Check size={12} strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stock Availability Badge for Selected Variant */}
                  <div className="pt-1">
                    {isVariantOutOfStock ? (
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <X size={13} strokeWidth={2.5} />
                        <span>Out of stock</span>
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={13} strokeWidth={2.5} />
                        <span>In stock</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Clean Action Buttons */}
              <div className="space-y-3 pt-3 border-t border-gray-150">
                <div className="flex items-center gap-2.5">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white shrink-0">
                    <button
                      onClick={decrementQty}
                      aria-label="Decrease quantity"
                      className="w-8 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 cursor-pointer"
                      disabled={quantity <= 1 || isVariantOutOfStock}
                    >
                      <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 text-xs sm:text-sm tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQty}
                      aria-label="Increase quantity"
                      className="w-8 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 cursor-pointer"
                      disabled={quantity >= (product.stock || 99) || isVariantOutOfStock}
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isVariantOutOfStock}
                    className={cn(
                      "flex-1 h-9 sm:h-10 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer",
                      isVariantOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        : isAddedSuccess
                          ? "bg-gray-900 text-white"
                          : "bg-gray-900 text-white hover:bg-black",
                    )}
                  >
                    {isVariantOutOfStock ? (
                      "Sold Out"
                    ) : isAdding ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : isAddedSuccess ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check size={15} strokeWidth={2.5} />
                        Added
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <ShoppingCart size={15} strokeWidth={2} />
                        Add To Cart
                      </span>
                    )}
                  </button>

                  {/* Buy Now CTA */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isVariantOutOfStock}
                    className="flex-1 h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Compare, Wishlist & Social Share Bar */}
                <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-gray-500 gap-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleCompare}
                      className={cn(
                        "flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer",
                        isComparing && "text-indigo-600 font-semibold",
                      )}
                    >
                      <ArrowLeftRight size={13} />
                      <span>{isComparing ? "In compare" : "Add to compare"}</span>
                    </button>

                    <button
                      onClick={handleToggleWishlist}
                      className={cn(
                        "flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer",
                        isWishlisted && "text-rose-600 font-semibold",
                      )}
                    >
                      <Bookmark
                        size={13}
                        fill={isWishlisted ? "currentColor" : "none"}
                        className={isWishlisted ? "text-rose-600 fill-rose-600" : ""}
                      />
                      <span>{isWishlisted ? "In wishlist" : "Add to wishlist"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Share:</span>
                    <button
                      onClick={handleCopyLink}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition"
                      title="Copy Link"
                      aria-label="Copy link"
                    >
                      <Link2 size={13} />
                    </button>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${
                        typeof window !== "undefined"
                          ? encodeURIComponent(window.location.href)
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition"
                      title="Share on Facebook"
                      aria-label="Share on Facebook"
                    >
                      <Facebook size={13} />
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${
                        typeof window !== "undefined"
                          ? encodeURIComponent(window.location.href)
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition"
                      title="Share on WhatsApp"
                      aria-label="Share on WhatsApp"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RIGHT: SHIPPING & DELIVERY CARD (Clean Minimal 3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight pb-2.5 border-b border-gray-200/70">
                  Shipping & Delivery
                </h3>

                {/* Standard Delivery */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Truck size={15} className="text-gray-500 shrink-0" />
                      <span>Standard Delivery</span>
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium">
                      1-3 Days
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-6 leading-relaxed">
                    Direct courier delivery to your specified address.
                  </p>
                </div>

                {/* Store Pickup */}
                <div className="space-y-1 pt-2.5 border-t border-gray-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Store size={15} className="text-gray-500 shrink-0" />
                      <span>Store Pickup</span>
                    </div>
                    <span className="text-[11px] text-gray-900 font-bold uppercase">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-6 leading-relaxed">
                    Collect directly from our store locations.
                  </p>
                </div>

                {/* Warranty Period */}
                <div className="space-y-1 pt-2.5 border-t border-gray-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-gray-500 shrink-0" />
                      <span>Warranty Period</span>
                    </div>
                    <span className="text-[11px] text-gray-900 font-semibold">
                      {product.warranty || "1 Year"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-6 leading-relaxed">
                    Official manufacturer warranty support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- SECONDARY SECTION: TABS & RELATED PRODUCTS --- */}
          <div
            id="product-tabs-section"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-20 pt-6 border-t border-gray-150"
          >
            <div className="lg:col-span-8">
              <ProductTabs product={product} />
            </div>
            <div className="lg:col-span-4 sticky top-6">
              <RelatedProducts products={relatedProducts} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ProductDetailsView.displayName = "ProductDetailsView";

export default ProductDetailsView;
