import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  ArrowRight,
  Home,
  Clock,
  Package,
  Truck,
  ShieldAlert,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceActions } from "./invoice-actions";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderConfirmationPage(props: PageProps) {
  const params = await props.params;
  const { orderId } = params;

  // 1. Fetch order by order number
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const steps = [
    { label: "Placed", status: "PENDING", icon: Clock },
    { label: "Processing", status: "PROCESSING", icon: Package },
    { label: "Shipped", status: "SHIPPED", icon: Truck },
    { label: "Delivered", status: "DELIVERED", icon: CheckCircle2 },
  ];

  const statusOrder = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 no-print">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4 shadow-inner">
            <CheckCircle2
              className="h-8 w-8 text-emerald-600"
              strokeWidth={3}
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Order Confirmed!
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Thank you for your purchase. Your order ID is{" "}
            <span className="font-bold text-gray-900">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Stepper Timeline */}
        <div className="no-print">
          {order.status === "CANCELLED" ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-center gap-3 text-red-700 animate-in fade-in">
              <ShieldAlert className="shrink-0" />
              <div>
                <p className="font-bold text-sm">Order Cancelled</p>
                <p className="text-xs opacity-90">This order has been cancelled.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Order Status
              </h3>
              <div className="relative flex items-center justify-between w-full px-2">
                {/* Connector Line */}
                <div className="absolute left-4 right-4 top-5 -translate-y-1/2 h-0.5 bg-gray-100 -z-10" />
                <div
                  className="absolute left-4 top-5 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-500 -z-10"
                  style={{
                    width: `${
                      currentIndex <= 0
                        ? 0
                        : (currentIndex / (steps.length - 1)) * 100
                    }%`,
                    maxWidth: "calc(100% - 2rem)",
                  }}
                />
                {/* Steps */}
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = idx < currentIndex;
                  const isActive = idx === currentIndex;
                  const isFuture = idx > currentIndex;

                  return (
                    <div key={idx} className="flex flex-col items-center relative z-10">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300",
                          isCompleted && "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100",
                          isActive && "border-indigo-600 text-indigo-600 scale-105 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50",
                          isFuture && "border-gray-200 text-gray-400"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={16} strokeWidth={3} />
                        ) : (
                          <StepIcon size={16} />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-bold mt-2",
                          isActive && "text-indigo-600",
                          isCompleted && "text-gray-900",
                          isFuture && "text-gray-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 border-b border-gray-50 pb-2">
              <User size={16} />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">
                Customer Info
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">{order.name}</p>
              {order.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{order.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{order.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 border-b border-gray-50 pb-2">
              <MapPin size={16} />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">
                Shipping Address
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {order.address}
            </p>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-white py-6 px-6 sm:py-8 sm:px-8 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 print-container print:shadow-none print:border-none print:p-0">
          {/* Print Invoice Header (only visible on print) */}
          <div className="hidden print:block border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-indigo-600">Input Gears</h1>
                <p className="text-xs text-gray-500 mt-1">Premium Mechanical Keyboards & Gear</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-900">INVOICE</h2>
                <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-gray-600">
              <div>
                <p className="font-bold text-gray-800 uppercase tracking-wider">Billed To:</p>
                <p className="mt-1 font-medium text-gray-900">{order.name}</p>
                {order.email && <p>{order.email}</p>}
                <p>{order.phone}</p>
                <p className="mt-2 whitespace-pre-wrap">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 uppercase tracking-wider">Invoice Details:</p>
                <p className="mt-1">Date: {formattedDate}</p>
                <p>Payment: {order.paymentMethod.toUpperCase()}</p>
                <p>Status: {order.paymentStatus.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4 print:hidden">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order Date</p>
              <p className="font-semibold text-gray-900 mt-0.5">{formattedDate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize mt-0.5 flex items-center gap-1.5 justify-end">
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-full",
                    order.paymentStatus === "PAID" ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                {order.paymentMethod === "COD" ? "Cash On Delivery" : "Online Payment"}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 print:mt-4">
              <FileText size={14} /> <span>Order Items</span>
            </p>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-4 py-1 border-b border-gray-50 pb-2 print:border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-100 shrink-0 print:border-gray-200">
                    x{item.quantity}
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-950 shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Bill Breakdown */}
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5 print:border-gray-300">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
              <span>Shipping Charge</span>
              <span className="font-semibold text-gray-900">
                {order.shippingAmount === 0 ? "Free" : `$${order.shippingAmount.toFixed(2)}`}
              </span>
            </div>

            {order.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>VAT/Tax</span>
                <span className="font-semibold text-gray-900">${order.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-end pt-3 border-t border-gray-100 mt-2 print:border-gray-200">
              <span className="text-base font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-black text-indigo-600 print:text-gray-950">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Client Invoice Actions */}
          <InvoiceActions />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 no-print">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all"
          >
            <Home size={18} /> Return Home
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-950 text-white rounded-xl font-bold shadow-lg shadow-gray-200/50 hover:bg-indigo-600 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Continue Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

