"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, Heart, Search, ArrowLeftRight, Package, AlertTriangle } from "lucide-react";
import { useCart, CartItem } from "@/modules/cart/hooks/use-cart";
import { useState, useEffect, memo, useMemo } from "react";
import { useWishlist } from "@/modules/products/hooks/use-wishlist";
import { useCompare } from "@/modules/products/hooks/use-compare";
import { useSession } from "@/lib/auth-client";
import { QuickViewModal } from "./quick-view-modal";
import { Product } from "@/types/product";

interface ProductTableViewProps {
  products: Product[];
}

interface TableRowProps {
  product: Product;
}

const TableRow = memo(({ product }: TableRowProps) => {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { data: session } = useSession();

  const [isAdded, setIsAdded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(product.price);
  }, [product.price]);

  const isWishlisted = isMounted ? wishlist.isInWishlist(product.id) : false;
  const isComparing = isMounted ? compare.isInCompare(product.id) : false;
  const isOutOfStock = product.stock === 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAdded) {
      timeout = setTimeout(() => setIsAdded(false), 1500);
    }
    return () => clearTimeout(timeout);
  }, [isAdded]);

  const onAddToCart = () => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || "",
      quantity: 1,
      maxStock: product.stock,
    };

    cart.addItem(cartItem, !!session);
    setIsAdded(true);
  };

  const onToggleWishlist = () => {
    wishlist.toggleItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image || "",
        stock: product.stock,
        category: product.category ? { name: product.category.name } : null,
      },
      !!session,
    );
  };

  const onToggleCompare = () => {
    if (isComparing) {
      compare.removeItem(product.id);
    } else {
      compare.addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image || "",
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

  return (
    <tr className="hover:bg-indigo-50/20 transition-colors border-b border-gray-100 group">
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          stock: product.stock,
          slug: product.slug,
          category: product.category,
          brand: product.brand || null,
          switchType: product.switchType,
        }}
      />
      {/* Product Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] italic">
                No Image
              </div>
            )}
          </div>
          <div>
            <Link
              href={`/products/${product.slug}`}
              className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors block max-w-xs truncate"
            >
              {product.name}
            </Link>
            {product.brand && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {product.brand}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Category Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.category ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 font-medium">
            {product.category.name}
          </span>
        ) : (
          <span className="text-gray-300 text-xs italic">-</span>
        )}
      </td>

      {/* Stock Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle size={12} />
            Sold Out
          </span>
        ) : product.stock <= 5 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            <Package size={12} />
            Low Stock ({product.stock})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Package size={12} />
            In Stock ({product.stock})
          </span>
        )}
      </td>

      {/* Price Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-black text-indigo-600 tabular-nums">
          {formattedPrice}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          {/* Wishlist */}
          <button
            onClick={onToggleWishlist}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
              isWishlisted
                ? "bg-indigo-600 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* Compare */}
          <button
            onClick={onToggleCompare}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
              isComparing
                ? "bg-amber-500 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
            }`}
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* Quick View */}
          <button
            onClick={() => setIsQuickViewOpen(true)}
            className="h-9 w-9 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          >
            <Search size={14} />
          </button>

          {/* Add to Cart */}
          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={`
              h-9 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95
              ${
                isOutOfStock
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100 shadow-none"
                  : isAdded
                    ? "bg-emerald-500 text-white shadow-emerald-100"
                    : "bg-gray-950 text-white shadow-gray-100 hover:bg-indigo-600 hover:shadow-indigo-50"
              }
            `}
          >
            {isAdded ? (
              <>
                <Check size={12} strokeWidth={3} className="animate-in zoom-in duration-500" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={12} strokeWidth={2} />
                <span>Buy</span>
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
});

TableRow.displayName = "TableRow";

export const ProductTableView = memo(({ products }: ProductTableViewProps) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Availability
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Price
              </th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.map((product) => (
              <TableRow key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ProductTableView.displayName = "ProductTableView";

export default ProductTableView;
