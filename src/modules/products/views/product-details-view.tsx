"use client";

import { useState, useMemo, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
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
  Home,
  Facebook,
  MessageCircle,
  Link2,
  Bookmark,
  ArrowLeftRight,
  Settings,
} from "lucide-react";

interface ProductDetailsViewProps {
  product: Product;
  relatedProducts: Product[];
  averageRating: number;
  totalReviews: number;
}

const ProductDetailsView = memo(
  ({ product, relatedProducts, averageRating, totalReviews }: ProductDetailsViewProps) => {
    const cart = useCart();
    const wishlist = useWishlist();
    const compare = useCompare();
    const { data: session } = useSession();
    const userRole = (session?.user as { role?: string })?.role;
    const router = useRouter();

    const [selectedImage, setSelectedImage] = useState(
      product.images?.[0] || product.image || "/placeholder.png",
    );
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string | null>(
      product.colors?.[0] || null,
    );
    const [isAdding, setIsAdding] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [paymentOption, setPaymentOption] = useState<"cash" | "emi">("cash");

    useEffect(() => {
      const frame = requestAnimationFrame(() => setIsMounted(true));
      return () => cancelAnimationFrame(frame);
    }, []);

    const isWishlisted = isMounted ? wishlist.isInWishlist(product.id) : false;
    const isComparing = isMounted ? compare.isInCompare(product.id) : false;

    const handleToggleWishlist = () => {
      wishlist.toggleItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] || product.image || "/placeholder.png",
          stock: product.stock,
        },
        !!session,
      );
    };

    const handleToggleCompare = () => {
      if (isComparing) {
        compare.removeItem(product.id);
      } else {
        compare.addItem({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] || product.image || "/placeholder.png",
          category: product.category,
          colors: product.colors,
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

    const formattedPrice = useMemo(() => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(product.price);
    }, [product.price]);

    const discountedPrice = useMemo(() => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(product.price * 1.2);
    }, [product.price]);

    // Quantity Handlers
    const incrementQty = () =>
      setQuantity((prev) => (prev < product.stock ? prev + 1 : prev));
    const decrementQty = () =>
      setQuantity((prev) => (prev > 1 ? prev - 1 : prev));

    const handleAddToCart = () => {
      setIsAdding(true);

      setTimeout(() => {
        cart.addItem(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.images?.[0] || product.image || "/placeholder.png",
            quantity: quantity,
            maxStock: product.stock,
          },
          !!session,
        );

        setIsAdding(false);
      }, 500);
    };

    const handleBuyNow = () => {
      cart.addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] || product.image || "/placeholder.png",
          quantity: quantity,
          maxStock: product.stock,
        },
        !!session,
      );
      router.push("/cart");
    };

    return (
      <div className="bg-[#fcfcff] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-gray-500 overflow-x-auto no-scrollbar">
              <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                <Home size={16} className="shrink-0" />
              </Link>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {product.category && (
                <>
                  <Link
                    href={`/${product.category.slug}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </>
              )}
              <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {product.name}
              </span>
            </nav>

            {isMounted && userRole && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(userRole) && (
              <Link
                href={`/admin/products/edit/${product.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-full text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Settings size={12} />
                <span>Edit Product (Admin)</span>
              </Link>
            )}
          </div>

          {/* Share & Save/Compare bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-6 bg-white border border-gray-100 rounded-2xl sm:rounded-full shadow-sm mb-8 text-sm font-semibold text-gray-500 gap-4">
            <div className="flex items-center gap-3">
              <span>Share:</span>
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-all hover:scale-105"
                title="Copy Link"
              >
                <Link2 size={16} />
              </button>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-all hover:scale-105"
                title="Share on Facebook"
              >
                <Facebook size={16} />
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-all hover:scale-105"
                title="Share on WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleWishlist}
                className={cn(
                  "flex items-center gap-1.5 hover:text-indigo-600 transition-colors",
                  isWishlisted && "text-indigo-600"
                )}
              >
                <Bookmark size={16} fill={isWishlisted ? "currentColor" : "none"} />
                <span>Save</span>
              </button>
              <button
                onClick={handleToggleCompare}
                className={cn(
                  "flex items-center gap-1.5 hover:text-amber-500 transition-colors",
                  isComparing && "text-amber-500"
                )}
              >
                <ArrowLeftRight size={16} />
                <span>Add to Compare</span>
              </button>
            </div>
          </div>

          {/* --- HERO SECTION: IMAGE & PRIMARY INFO --- */}
          <div className="lg:grid lg:grid-cols-[4.5fr_7.5fr] lg:gap-12 items-start mb-12 lg:mb-20">
            
            {/* --- LEFT: IMAGE GALLERY --- */}
            <div className="flex flex-col gap-4">
              <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                {/* Badge Overlay */}
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50/50">
                    New Arrival
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-center overflow-x-auto pb-3 no-scrollbar">
                {(product.images || (product.image ? [product.image] : [])).map(
                  (img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    aria-label={`View product image ${index + 1}`}
                    className={cn(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 bg-white",
                      selectedImage === img
                        ? "border-indigo-600 shadow-md shadow-indigo-100"
                        : "border-transparent hover:border-gray-200 grayscale hover:grayscale-0 opacity-60 hover:opacity-100",
                    )}
                  >
                    <Image
                      src={img}
                      alt="Thumbnail"
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* --- RIGHT: PRODUCT INFO --- */}
            <div className="mt-8 lg:mt-0 space-y-6">
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                  {product.name}
                </h1>

                {/* Badges / Specs Row */}
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                  <span className="px-3 py-1.5 bg-gray-100/80 rounded-full">
                    Price: <span className="text-indigo-600 font-bold">{formattedPrice}</span>{" "}
                    <span className="text-gray-400 line-through font-normal">{discountedPrice}</span>
                  </span>
                  <span className="px-3 py-1.5 bg-gray-100/80 rounded-full">
                    Regular Price: <span className="text-gray-800 font-bold">{discountedPrice}</span>
                  </span>
                  <span className={cn(
                    "px-3 py-1.5 rounded-full font-bold",
                    product.stock > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  )}>
                    Status: {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  {product.sku && (
                    <span className="px-3 py-1.5 bg-gray-100/80 rounded-full">
                      Product Code: <span className="text-gray-800 font-bold">{product.sku}</span>
                    </span>
                  )}
                  {product.brand && (
                    <span className="px-3 py-1.5 bg-gray-100/80 rounded-full">
                      Brand: <span className="text-gray-800 font-bold">{product.brand}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2.5 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Key Features
                </h3>
                <ul className="space-y-1.5 text-sm text-gray-600 font-medium list-disc pl-4">
                  {product.brand && (
                    <li>
                      Brand: <span className="text-gray-900 font-semibold">{product.brand}</span>
                    </li>
                  )}
                  <li>
                    Model: <span className="text-gray-900 font-semibold">{product.name}</span>
                  </li>
                  {product.connectionType && (
                    <li>
                      Connection Type: <span className="text-gray-900 font-semibold">{product.connectionType}</span>
                    </li>
                  )}
                  {product.switchType && (
                    <li>
                      Switch Type: <span className="text-gray-900 font-semibold">{product.switchType}</span>
                    </li>
                  )}
                  {product.warranty && (
                    <li>
                      Warranty: <span className="text-gray-900 font-semibold">{product.warranty}</span>
                    </li>
                  )}
                  {product.availability && (
                    <li>
                      Availability: <span className="text-gray-900 font-semibold">{product.availability}</span>
                    </li>
                  )}
                </ul>
                <a 
                  href="#product-tabs-section"
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline inline-block"
                >
                  View More Info
                </a>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Payment Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Cash/Card Discount */}
                  <div
                    onClick={() => setPaymentOption("cash")}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 bg-white",
                      paymentOption === "cash"
                        ? "border-indigo-600 shadow-md shadow-indigo-50/50"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        paymentOption === "cash"
                          ? "border-indigo-600 bg-white"
                          : "border-gray-300 bg-white"
                      )}>
                        {paymentOption === "cash" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-lg font-black text-gray-900">{formattedPrice}</span>
                        <span className="text-xs text-gray-400 line-through">{discountedPrice}</span>
                      </div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-tight mt-1">
                        Cash Discount Price
                      </p>
                      <p className="text-xs text-gray-400 font-medium leading-none mt-0.5">
                        Online / Cash Payment
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Monthly EMI */}
                  <div
                    onClick={() => setPaymentOption("emi")}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 bg-white",
                      paymentOption === "emi"
                        ? "border-indigo-600 shadow-md shadow-indigo-50/50"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        paymentOption === "emi"
                          ? "border-indigo-600 bg-white"
                          : "border-gray-300 bg-white"
                      )}>
                        {paymentOption === "emi" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-lg font-black text-gray-900">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(product.price / 12)}/month
                        </span>
                      </div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-tight mt-1">
                        Regular Price: {discountedPrice}
                      </p>
                      <p className="text-xs text-gray-400 font-medium leading-none mt-0.5">
                        0% EMI for up to 12 Months*
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colors (Conditional Theme Selector) */}
              {product.colors && product.colors.length > 1 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    Primary Theme <div className="h-px bg-gray-100 flex-1" />
                  </h3>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`Select color ${color}`}
                        className={cn(
                          "group relative h-8 w-8 rounded-full border-2 p-0.5 flex items-center justify-center transition-all duration-300",
                          selectedColor === color
                            ? "border-indigo-600 scale-105 shadow-md shadow-indigo-100"
                            : "border-transparent hover:scale-105",
                        )}
                        title={color}
                      >
                        <div
                          className="h-full w-full rounded-full transition-transform duration-300 group-hover:scale-90"
                          style={{
                            backgroundColor: color
                              .toLowerCase()
                              .includes("white")
                              ? "#fff"
                              : color.toLowerCase(),
                          }}
                        />
                        {selectedColor === color && (
                          <Check
                            size={10}
                            className={cn(
                              "absolute",
                              color.toLowerCase().includes("white")
                                ? "text-indigo-600"
                                : "text-white",
                            )}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions: Quantity & Buy Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <div className="flex items-center p-0.5 border border-gray-200 rounded-xl bg-white shadow-sm shrink-0">
                    <button
                      onClick={decrementQty}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 transition disabled:opacity-30"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
                    </button>
                    <span className="w-6 md:w-10 text-center font-black text-gray-900 text-sm md:text-base">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQty}
                      aria-label="Increase quantity"
                      className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 transition disabled:opacity-30"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    className="flex-1 bg-indigo-600 text-white h-10 md:h-11 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all duration-300 shadow-md active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </div>
                {/* Empty column for alignment */}
                <div className="hidden sm:block" />
              </div>

            </div>
          </div>

          {/* --- SECONDARY SECTION: TABS & RELATED PRODUCTS --- */}
          <div id="product-tabs-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-20">
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
