import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Package,
  User,
  Truck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import OrderStatusSelector from "@/modules/admin/components/order-status-selector";
import Image from "next/image";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Calculate Subtotal (since items might have snapshotted prices)
  const subtotal = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = 0; // Or fetch from order if implemented

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 1. Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Order #{order.orderNumber.slice(-6).toUpperCase()}
              </h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Calendar size={12} />
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="h-1 w-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Package size={12} />
                {order.items.length} Items
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">
            Update Status:
          </span>
          <OrderStatusSelector
            orderId={order.id}
            currentStatus={order.status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Order Items & Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* A. Order Items List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm dark:shadow-none overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/30 flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} className="text-indigo-600" />
                Products Information
              </h2>
            </div>
            <div className="p-6">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-6 first:pt-0 last:pb-0 group"
                  >
                    <div className="flex gap-6">
                      <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              target="_blank"
                              className="font-black text-gray-900 dark:text-white uppercase tracking-tight hover:text-indigo-600 transition-colors flex items-center gap-2 group/link"
                            >
                              {item.name}
                              <ExternalLink
                                size={14}
                                className="opacity-0 group-hover/link:opacity-100 transition-opacity"
                              />
                            </Link>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              ID: {item.product.id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              ${item.price.toFixed(2)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-800">
                            Fulfillment: {order.status}
                          </span>
                          <p className="text-sm font-black text-indigo-600">
                            Total: ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/20">
              <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 ring-4 ring-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Shipping Method
                    </p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                      Standard Delivery (3-5 Days)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                    Cost
                  </p>
                  <p className="text-xs font-black text-green-600 uppercase tracking-tight">
                    Free Shipping
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer & Summary */}
        <div className="space-y-8">
          {/* B. Customer Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm dark:shadow-none overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/30 flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-indigo-600" />
                Customer Contact
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-black text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-inner">
                  {(order.user?.name || order.name || "G")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {order.user?.name || order.name || "Guest User"}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Member since{" "}
                    {order.user
                      ? new Date(order.user.createdAt).getFullYear()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg translate-y-0.5">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                      Email Address
                    </p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white lowecase">
                      {order.user?.email || order.email || "No email provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg translate-y-0.5">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                      Phone Number
                    </p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {order.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* C. Shipping Address */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm dark:shadow-none overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/30">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-indigo-600" />
                Shipping Address
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-800/50/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed uppercase tracking-tight">
                  {order.address}
                </p>
              </div>
            </div>
          </div>

          {/* D. Payment Summary */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm dark:shadow-none overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/30 flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-indigo-600" />
                Billing Summary
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <span>Shipping</span>
                <span className="text-green-500">Free</span>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="text-2xl font-black text-indigo-600 tracking-tight">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                    Method
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-tight">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
