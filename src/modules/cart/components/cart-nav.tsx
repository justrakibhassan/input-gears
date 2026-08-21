"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useCartDrawer } from "@/modules/cart/hooks/use-cart-drawer";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useSession } from "@/lib/auth-client";
import { ShoppingBag, X, Trash2, ArrowRight, Truck } from "lucide-react";

export default function CartNav() {
  const { isOpen, open, close } = useCartDrawer();
  const cart = useCart();
  const { data: session } = useSession();

  useScrollLock(isOpen);

  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const freeShippingThreshold = 100;
  const progress = Math.min((total / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - total;

  const TriggerButton = (
    <button
      onClick={open}
      aria-label={`Open cart, ${totalItems} items`}
      className="relative hidden md:inline-flex items-center justify-center p-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all active:scale-95 group"
    >
      <ShoppingBag
        size={24}
        className="group-hover:scale-105 transition-transform"
      />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in">
          {totalItems}
        </span>
      )}
    </button>
  );

  const DrawerContent = (
    <div className="relative z-1400">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={close}
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shadow-sm z-10 bg-white shrink-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              My Cart
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {totalItems}
              </span>
            </h2>
            <button
              onClick={close}
              aria-label="Close cart"
              className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                  <ShoppingBag size={48} className="text-indigo-200" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-600 max-w-[220px] mx-auto leading-relaxed">
                    Looks like you haven&apos;t added anything to your cart yet.
                  </p>
                </div>
                <button
                  onClick={close}
                  className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-linear-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 text-indigo-700 mb-2.5">
                    <Truck size={18} className="fill-indigo-200" />
                    <span className="text-sm font-semibold tracking-tight">
                      {remainingForFreeShipping > 0 ? (
                        <span>
                          Add{" "}
                          <span className="font-bold">
                            ${remainingForFreeShipping.toFixed(2)}
                          </span>{" "}
                          more for free shipping
                        </span>
                      ) : (
                        "You've unlocked FREE shipping! 🎉"
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden border border-indigo-100">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-6">
                  {cart.items.map((item) => (
                    <li key={item.id} className="flex gap-4 group">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={close}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              {item.name}
                            </Link>
                          </h3>
                          <p className="font-bold text-gray-900 whitespace-nowrap">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
                            <span>Qty: {item.quantity}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => cart.removeItem(item.id, !!session)}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-6 bg-gray-50/50 backdrop-blur-xl shrink-0">
              <div className="flex justify-between items-end mb-4">
                <p className="text-base font-medium text-gray-600">Subtotal</p>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ${total.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Shipping & taxes calculated at checkout
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  onClick={close}
                  className="flex items-center justify-center w-full rounded-xl border border-transparent bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                  Checkout Now
                  <ArrowRight size={18} className="ml-2" />
                </Link>

                <Link
                  href="/cart"
                  onClick={close}
                  className="flex items-center justify-center w-full rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all"
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {TriggerButton}
      {isOpen && createPortal(DrawerContent, document.body)}
    </>
  );
}
