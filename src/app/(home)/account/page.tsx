import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AccountView from "@/modules/account/views/account-view";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // 1. Fetch latest 5 orders with item and product category details
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              category: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 2. Status calculation
  const totalOrders = await prisma.order.count({
    where: { userId: session.user.id },
  });

  const pendingOrders = await prisma.order.count({
    where: {
      userId: session.user.id,
      status: "PENDING",
    },
  });

  // Total Spent Calculation
  const aggregations = await prisma.order.aggregate({
    where: { userId: session.user.id },
    _sum: { totalAmount: true },
  });
  const totalSpent = aggregations._sum.totalAmount || 0;

  // 3. Wishlist items and count
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          stock: true,
          brand: true,
          category: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const wishlistCount = await prisma.wishlistItem.count({
    where: { userId: session.user.id },
  });

  // 4. Default or first address
  const userAddress = await prisma.address.findFirst({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  // 5. Orders placed this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const ordersThisMonth = await prisma.order.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: startOfMonth },
    },
  });

  // 6. Send data to view
  const dashboardData = {
    totalOrders,
    pendingOrders,
    totalSpent,
    recentOrders: orders,
    wishlistItems: wishlistItems.map((item) => item.product),
    wishlistCount,
    userAddress,
    ordersThisMonth,
  };

  return <AccountView session={session} dashboardData={dashboardData} />;
}
