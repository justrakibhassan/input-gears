"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Package,
  CreditCard,
  Clock,
  ArrowRight,
  Heart,
  Star,
  Zap,
  MapPin,
  Pencil,
  Check,
  Mouse,
  Keyboard,
  Headphones,
  Monitor,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { Order, OrderItem, Address } from "@prisma/client";

interface EnrichedOrderItem extends OrderItem {
  product?: {
    category?: {
      slug: string;
    } | null;
  } | null;
}

interface EnrichedOrder extends Order {
  items?: EnrichedOrderItem[];
}

interface AccountViewProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role?: string | null;
      createdAt?: Date;
    };
  };
  dashboardData: {
    totalOrders: number;
    pendingOrders: number;
    totalSpent: number;
    recentOrders: EnrichedOrder[];
    wishlistItems: {
      id: string;
      name: string;
      slug: string;
      price: number;
      image: string | null;
      stock: number;
      brand: string | null;
      category: {
        slug: string;
      } | null;
    }[];
    wishlistCount: number;
    userAddress: Address | null;
    ordersThisMonth: number;
  };
}

const formatJoinDate = (date: Date | string | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getCategoryIcon = (categorySlug?: string, productName?: string) => {
  const slug = categorySlug?.toLowerCase() || "";
  const name = productName?.toLowerCase() || "";
  
  if (slug.includes("mice") || name.includes("mouse") || name.includes("superlight") || name.includes("deathadder")) {
    return Mouse;
  }
  if (slug.includes("keyboards") || name.includes("keyboard") || name.includes("keychron") || name.includes("ducky")) {
    return Keyboard;
  }
  if (slug.includes("audio") || name.includes("headset") || name.includes("headphones") || name.includes("cloud") || name.includes("alpha")) {
    return Headphones;
  }
  if (slug.includes("monitors") || name.includes("monitor") || name.includes("swift") || name.includes("screen")) {
    return Monitor;
  }
  return Package;
};

const renderStatusBadge = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
          Delivered
        </span>
      );
    case "SHIPPED":
    case "PROCESSING":
      return (
        <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
          In Transit
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
          Pending
        </span>
      );
  }
};

export default function AccountView({
  session,
  dashboardData,
}: AccountViewProps) {
  const { user } = session;
  const {
    totalOrders,
    pendingOrders,
    totalSpent,
    recentOrders,
    wishlistItems,
    wishlistCount,
    userAddress,
    ordersThisMonth,
  } = dashboardData;

  const cart = useCart();

  const isAdmin = user.role === "SUPER_ADMIN";
  const isManager = user.role === "MANAGER";
  const isEditor = user.role === "CONTENT_EDITOR";
  const canAccessAdmin = isAdmin || isManager || isEditor;

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: Package,
      color: "text-[#818CF8]",
      bg: "bg-[#818CF8]/10",
      subText: `${ordersThisMonth} this month`,
    },
    {
      label: "Pending",
      value: pendingOrders,
      icon: Clock,
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10",
      subText: "Est. 3–5 days",
    },
    {
      label: "Total Spent",
      value: `$${totalSpent.toLocaleString()}`,
      icon: CreditCard,
      color: "text-[#10B981]",
      bg: "bg-[#10B981]/10",
      subText: "Lifetime",
    },
    {
      label: "Wishlist",
      value: wishlistCount,
      icon: Heart,
      color: "text-[#EF4444]",
      bg: "bg-[#EF4444]/10",
      subText: "items saved",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-gray-900">
      {/* 1. Header Section (Profile Card) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -mr-16 -mt-16 z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-indigo-600 bg-indigo-50">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* ✅ Verified Badge for Admin */}
              {isAdmin && (
                <div
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  title="Verified Admin"
                >
                  <BadgeCheck size={14} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200 flex items-center gap-1">
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm font-medium">{user.email}</p>
              <p className="text-xs text-gray-400">
                Member since {formatJoinDate(user.createdAt)} • {userAddress ? `${userAddress.city}, ${userAddress.country}` : "Khulna, Bangladesh"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canAccessAdmin && (
              <Link
                href="/admin"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
              >
                <Shield size={14} className="text-gray-400" />
                Admin panel
              </Link>
            )}
            <Link
              href="/account/profile"
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
            >
              <Pencil size={14} className="text-gray-400" />
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm flex flex-col justify-between h-[130px] group transition-all duration-300 hover:shadow-md hover:border-gray-200"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${stat.color} tracking-wider`}>
                {stat.label}
              </span>
              <div className={`p-2 rounded-xl ${stat.bg} text-white`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {stat.subText}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Recent Orders */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-gray-400" />
                Recent Orders
              </h3>
              <Link
                href="/account/orders"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/link"
              >
                View all
                <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 3).map((order) => {
                  const firstItem = order.items?.[0];
                  const itemName = firstItem?.name || `Order #${order.orderNumber}`;
                  const categorySlug = firstItem?.product?.category?.slug;
                  const Icon = getCategoryIcon(categorySlug, itemName);
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <Icon size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 max-w-[200px] sm:max-w-[280px] truncate">
                            {itemName}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5 font-bold">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })} • #{order.orderNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-sm font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                        {renderStatusBadge(order.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package size={36} className="text-gray-300 mb-3" />
                <h4 className="text-sm font-bold text-gray-400">No orders yet</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px] font-bold">
                  You haven&apos;t placed any orders yet.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side: Wishlist & Quick Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Wishlist Block */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Heart size={18} className="text-gray-400" />
                  Wishlist
                </h3>
                <Link
                  href="/wishlist"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/link"
                >
                  View all
                  <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>

              {wishlistItems.length > 0 ? (
                <div className="space-y-4">
                  {wishlistItems.slice(0, 3).map((product) => {
                    const Icon = getCategoryIcon(product.category?.slug, product.name);
                    const isAvailable = product.stock > 0;
                    
                    const handleAddToCart = async () => {
                      await cart.addItem({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        image: product.image || undefined,
                        quantity: 1,
                        maxStock: product.stock,
                      }, !!session?.user);
                    };

                    return (
                      <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            <Icon size={20} className="text-gray-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 max-w-[140px] sm:max-w-[200px] truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5 font-bold">
                              ${product.price.toFixed(2)} • <span className={isAvailable ? "text-[#059669] font-bold" : "text-[#E11D48] font-bold"}>
                                {isAvailable ? "In stock" : "Out of stock"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div>
                          {isAvailable ? (
                            <button
                              onClick={handleAddToCart}
                              className="px-3 py-1.5 bg-gray-900 hover:bg-indigo-600 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              Add to cart
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold text-[11px] rounded-xl cursor-not-allowed"
                            >
                              Notify me
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Heart size={36} className="text-gray-300 mb-3" />
                  <h4 className="text-sm font-bold text-gray-400">Your wishlist is empty</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-[240px] font-bold">
                    Explore our gadgets and add items to save them here.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions Block */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
              <Zap size={18} className="text-[#818CF8]" />
              <h3 className="text-base font-bold text-gray-900">Quick actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/account/addresses"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-2xl text-xs font-semibold transition-all group shadow-sm"
              >
                <MapPin size={16} className="text-gray-400 group-hover:text-gray-600" />
                Manage addresses
              </Link>
              <Link
                href="/account/reviews"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-2xl text-xs font-semibold transition-all group shadow-sm"
              >
                <Star size={16} className="text-gray-400 group-hover:text-gray-600" />
                My reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
