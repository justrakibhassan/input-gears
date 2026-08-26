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
  MapPin,
  Pencil,
  Plus,
  Shield,
  BadgeCheck,
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
  ExternalLink,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { Order, OrderItem, Address } from "@prisma/client";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

const renderStatusBadge = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Delivered
        </span>
      );
    case "SHIPPED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Shipped
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Processing
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Pending
        </span>
      );
  }
};

export default function AccountView({
  session,
  dashboardData,
}: AccountViewProps) {
  const router = useRouter();
  const { user } = session;
  const {
    totalOrders,
    pendingOrders,
    totalSpent,
    recentOrders,
    wishlistItems,
    wishlistCount,
    userAddress,
  } = dashboardData;

  const cart = useCart();

  const isAdmin = user.role === "SUPER_ADMIN";
  const isManager = user.role === "MANAGER";
  const isEditor = user.role === "CONTENT_EDITOR";
  const canAccessAdmin = isAdmin || isManager || isEditor;

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Logged out successfully");
    router.push("/sign-in");
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* 1. Profile Welcome Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center font-bold text-2xl text-indigo-600 overflow-hidden shadow-xs">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={72}
                    height={72}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {isAdmin && (
                <div
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full border-2 border-white shadow-xs"
                  title="Admin"
                >
                  <BadgeCheck size={12} />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  Hello, {user.name}
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider border border-indigo-200 inline-flex items-center gap-1">
                    <Shield size={11} /> Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                {user.email}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Member since {formatJoinDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0">
            {canAccessAdmin && (
              <Link
                href="/admin"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition-all shadow-xs"
              >
                <Shield size={14} />
                <span>Admin Panel</span>
              </Link>
            )}
            <Link
              href="/account/profile"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-xs"
            >
              <Pencil size={13} className="text-gray-500" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders */}
        <Link
          href="/account/orders"
          className="bg-white border border-gray-200/80 hover:border-indigo-300 p-4 sm:p-5 rounded-2xl shadow-xs transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {totalOrders}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              {pendingOrders > 0 ? `${pendingOrders} in progress` : "All completed"}
            </span>
          </div>
        </Link>

        {/* Pending Orders */}
        <Link
          href="/account/orders"
          className="bg-white border border-gray-200/80 hover:border-amber-300 p-4 sm:p-5 rounded-2xl shadow-xs transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Pending
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {pendingOrders}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              Active shipments
            </span>
          </div>
        </Link>

        {/* Wishlist */}
        <Link
          href="/account/wishlist"
          className="bg-white border border-gray-200/80 hover:border-rose-300 p-4 sm:p-5 rounded-2xl shadow-xs transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Wishlist
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
              <Heart size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {wishlistCount}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              Items saved
            </span>
          </div>
        </Link>

        {/* Total Spent */}
        <div className="bg-white border border-gray-200/80 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Total Spent
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-gray-400 font-medium mt-0.5">
              Lifetime purchases
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recent Orders Card (Primary E-Commerce Focus) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-indigo-600" />
              Recent Orders
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Track and view your recent purchases
            </p>
          </div>
          <Link
            href="/account/orders"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentOrders.slice(0, 3).map((order) => {
              const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 1;
              const firstItem = order.items?.[0];

              return (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Item Thumbnail Preview */}
                    <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {firstItem?.image ? (
                        <Image
                          src={firstItem.image}
                          alt={firstItem.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag size={22} className="text-gray-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </span>
                        {renderStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })} • {itemsCount} {itemsCount === 1 ? "item" : "items"}
                      </p>
                      <p className="text-xs font-semibold text-gray-700 truncate max-w-md">
                        {firstItem?.name || "Gear purchase"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="sm:text-right">
                      <span className="text-xs text-gray-400 block">Total</span>
                      <span className="text-sm sm:text-base font-extrabold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No orders placed yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              When you place an order, you can track delivery and status right here.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* 4. Dual Grid: Address & Wishlist Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Shipping Address */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" />
                Default Shipping Address
              </h3>
              <Link
                href="/account/addresses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
              >
                <span>Manage</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {userAddress ? (
              <div className="space-y-1.5 text-xs sm:text-sm text-gray-600">
                <p className="font-bold text-gray-900 text-sm">{userAddress.name}</p>
                <p>{userAddress.street}</p>
                <p>
                  {userAddress.city}
                  {userAddress.state ? `, ${userAddress.state}` : ""} {userAddress.zip}
                </p>
                <p>{userAddress.country}</p>
                {userAddress.phone && (
                  <p className="text-xs text-gray-500 pt-1">Phone: {userAddress.phone}</p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-500 mb-3">No default address saved yet.</p>
                <Link
                  href="/account/addresses"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                >
                  <Plus size={14} />
                  <span>Add Shipping Address</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Quick View */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Heart size={18} className="text-rose-500" />
                Wishlist Items ({wishlistCount})
              </h3>
              <Link
                href="/account/wishlist"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {wishlistItems.length > 0 ? (
              <div className="space-y-3">
                {wishlistItems.slice(0, 3).map((item) => {
                  const isAvailable = item.stock > 0;

                  const handleAddToCart = async () => {
                    await cart.addItem(
                      {
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        price: item.price,
                        image: item.image || undefined,
                        quantity: 1,
                        maxStock: item.stock,
                      },
                      !!session?.user
                    );
                    toast.success(`${item.name} added to cart!`);
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ShoppingBag size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAvailable ? (
                          <button
                            onClick={handleAddToCart}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-500">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-500 mb-3">Your wishlist is currently empty.</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                >
                  <ShoppingBag size={14} />
                  <span>Discover Gears</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Mobile Navigation Menu List (Only shown on Mobile) */}
      <div className="block md:hidden space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Account Shortcuts
        </h3>
        <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 shadow-xs overflow-hidden">
          <Link
            href="/account/orders"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">My Orders</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>

          <Link
            href="/account/wishlist"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Wishlist</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>

          <Link
            href="/account/addresses"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Addresses</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>

          <Link
            href="/account/reviews"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">My Reviews</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>

          <Link
            href="/account/profile"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserIcon size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Profile Settings</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span className="text-sm font-semibold">Sign Out</span>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
