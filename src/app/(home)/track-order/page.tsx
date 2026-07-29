"use client";

import { useState } from "react";
import { Search, Package, CheckCircle2, Clock, Truck, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  name: string;
  address: string;
  createdAt: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
  }[];
}

const STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      toast.error("Please enter Order Number and Phone or Email");
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Order not found");
      } else {
        setOrder(data);
        toast.success("Order status retrieved!");
      }
    } catch (err) {
      toast.error("Failed to fetch order status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: string) => {
    if (!order) return "upcoming";
    if (order.status === "CANCELLED") return "cancelled";
    
    const currentIndex = STEPS.indexOf(order.status);
    const stepIndex = STEPS.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="bg-[#fcfcff] min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <Truck size={14} />
            <span>Live Delivery Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto font-medium">
            Enter your order number and email/phone to view live shipment timeline and details.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8 mb-10">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Order Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-10492"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-indigo-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Phone or Email Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01700000000 or user@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-indigo-600 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition active:scale-98 shadow-md disabled:bg-gray-300 cursor-pointer"
            >
              <Search size={16} />
              <span>{loading ? "Searching Order..." : "Track Order Status"}</span>
            </button>
          </form>
        </div>

        {/* Result Container */}
        {order && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-10 space-y-8 animate-fade-in">
            
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Order #{order.orderNumber}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider",
                  order.status === "DELIVERED" && "bg-emerald-50 text-emerald-700",
                  order.status === "SHIPPED" && "bg-blue-50 text-blue-700",
                  order.status === "PROCESSING" && "bg-amber-50 text-amber-700",
                  order.status === "PENDING" && "bg-gray-100 text-gray-700",
                  order.status === "CANCELLED" && "bg-rose-50 text-rose-700"
                )}>
                  Status: {order.status}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            {order.status !== "CANCELLED" ? (
              <div className="py-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Shipment Progress
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {STEPS.map((step, idx) => {
                    const status = getStepStatus(step);
                    return (
                      <div key={step} className="flex flex-col items-center text-center space-y-2">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                          status === "completed" && "bg-indigo-600 text-white shadow-md shadow-indigo-200",
                          status === "current" && "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse",
                          status === "upcoming" && "bg-gray-100 text-gray-400"
                        )}>
                          {status === "completed" ? <CheckCircle2 size={18} /> : idx + 1}
                        </div>
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          status === "completed" && "text-indigo-600",
                          status === "current" && "text-amber-600",
                          status === "upcoming" && "text-gray-400"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={20} />
                <span>This order was cancelled. Please contact support if you need assistance.</span>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Items in Order
              </h3>
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 m-auto text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-900 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 font-extrabold text-gray-900">
              <span>Total Amount Paid/Due</span>
              <span className="text-lg text-indigo-600">${order.totalAmount.toFixed(2)}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
