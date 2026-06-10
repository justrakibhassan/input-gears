import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  History,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  User as UserIcon,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EditCustomerButton from "@/modules/admin/components/edit-customer-button";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) notFound();

  const totalSpent = user.orders.reduce(
    (acc, order) => acc + order.totalAmount,
    0
  );
  const totalOrders = user.orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const isVIP = totalSpent > 500;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors w-fit group"
        >
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all">
            <ArrowLeft size={16} />
          </div>
          Back to Customers
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden flex items-center justify-center relative">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <UserIcon size={32} className="text-gray-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  {user.name}
                </h1>
                {isVIP && (
                  <span className="px-2 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest shadow-sm dark:shadow-none">
                    VIP Member
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  Role: <span className="text-gray-900 dark:text-white">{user.role}</span>
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  Joined:{" "}
                  <span className="text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <EditCustomerButton user={user} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-8">
          {/* Contact Info Card */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-50 dark:border-gray-800 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700">
              <Mail size={120} />
            </div>
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              Contact Details
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Mail size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Email Address
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Phone size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Phone Number
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {user.phone || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gray-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 to-transparent pointer-events-none" />
            <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Lifetime Analytics
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  Total Orders
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tabular-nums">
                    {totalOrders}
                  </span>
                  <ShoppingBag size={14} className="text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  AOV
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tabular-nums">
                    ${avgOrderValue.toFixed(0)}
                  </span>
                  <TrendingUp size={14} className="text-emerald-400" />
                </div>
              </div>
              <div className="col-span-2 pt-6 border-t border-white/10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">
                  Gross Revenue
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-white/60 tabular-nums">
                    ${totalSpent.toLocaleString()}
                  </span>
                  <CreditCard size={18} className="text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-[40px] border border-gray-50 dark:border-gray-800 shadow-sm dark:shadow-none min-h-full overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50/30">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                Purchase History
              </h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {user.orders.length} items
              </span>
            </div>

            {user.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center flex-1">
                <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] flex items-center justify-center text-gray-200 mb-6">
                  <ShoppingBag size={40} />
                </div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
                  No Transactions Yet
                </h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                  This customer hasn&apos;t placed any orders in your store.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800 flex-1">
                {user.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 dark:bg-gray-800/50/50 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100 dark:border-gray-800 group-hover:bg-white dark:bg-gray-900 group-hover:border-indigo-100 transition-all">
                        #{order.orderNumber.slice(-4).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-0.5">
                          {order.items.length} Product
                          {order.items.length > 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-indigo-600 tabular-nums">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border",
                            order.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : order.status === "CANCELLED"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          )}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="p-2 text-gray-300 group-hover:text-indigo-600 transition-colors">
                        <Eye size={20} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
