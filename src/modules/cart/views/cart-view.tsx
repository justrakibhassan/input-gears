"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";

export default function CartView() {
  const cart = useCart();
  const { data: session } = useSession();

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 60;
  const total = subtotal + shipping;

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;
    cart.updateQuantity(id, numValue, !!session);
  };

  const handleClearCart = () => {
    cart.clearCart();
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="h-32 w-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mt-2 max-w-sm">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link
          href="/products"
          className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-end gap-3 tracking-tight">
        Shopping Cart
        <span className="text-sm font-semibold text-gray-500 mb-1.5 bg-gray-100 px-2 py-0.5 rounded-full">
          {totalItems} items
        </span>
      </h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start relative">
        <div className="lg:col-span-8 space-y-6">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="group bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
            >
              <div className="flex gap-4 sm:gap-6">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-28 w-28 sm:h-32 sm:w-32 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 cursor-pointer"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight hover:text-indigo-600 transition-colors line-clamp-2">
                        <Link href={`/products/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <p className="text-gray-500 text-sm mt-1.5 font-medium">
                        ${item.price.toFixed(2)}{" "}
                        <span className="text-gray-300 px-1">×</span>{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-lg text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
                      <button
                        onClick={() =>
                          cart.updateQuantity(item.id, item.quantity - 1, !!session)
                        }
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 bg-white shadow-sm rounded-lg hover:text-indigo-600 disabled:opacity-50 disabled:shadow-none transition-all"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, e.target.value)
                        }
                        className="w-10 text-center bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() =>
                          cart.updateQuantity(item.id, item.quantity + 1, !!session)
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 bg-white shadow-sm rounded-lg hover:text-indigo-600 disabled:opacity-50 disabled:shadow-none transition-all"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      onClick={() => cart.removeItem(item.id, !!session)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4">
            <Link
              href="/products"
              className="flex items-center text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="mr-2 group-hover:-translate-x-1 transition-transform"
              />
              Continue Shopping
            </Link>

            <button
              onClick={handleClearCart}
              className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 mt-8 lg:mt-0 relative h-full">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

              <h2 className="text-xl font-bold text-gray-900 mb-6 relative z-10">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                      Free
                    </span>
                  ) : (
                    <span className="text-gray-900">
                      ${shipping.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-200 my-4" />

                <div className="flex justify-between items-end">
                  <span className="text-base font-bold text-gray-900">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                      ${total.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      Taxes & shipping calculated at checkout
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full mt-8 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-600 hover:shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center group"
              >
                Checkout
                <ArrowRight
                  size={20}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Link>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-gray-500 bg-gray-50 py-2 rounded-lg">
                  <ShieldCheck size={12} className="text-indigo-500" />
                  Secure Payment
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-gray-500 bg-gray-50 py-2 rounded-lg">
                  <RefreshCcw size={12} className="text-indigo-500" />
                  30 Days Return
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
