"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAbandonedCarts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  try {
    const abandonedCarts = await prisma.user.findMany({
      where: {
        cart: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cart: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return abandonedCarts.map((user) => {
      const totalAmount = user.cart.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        itemsCount: user.cart.length,
        totalAmount,
        lastActive: user.updatedAt,
        items: user.cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
      };
    });
  } catch (error) {
    console.error("Failed to fetch abandoned carts:", error);
    throw new Error("Failed to fetch abandoned carts");
  }
}

export async function sendCartRecoveryEmail({
  userId,
  userEmail,
  userName,
  couponCode,
  discountPercent,
  customMessage,
}: {
  userId: string;
  userEmail: string;
  userName?: string;
  couponCode?: string;
  discountPercent?: number;
  customMessage?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  try {
    // In production, integrate with Resend / transactional email provider
    console.log(
      `[Cart Recovery] Sent recovery email to ${userEmail} (${userName || "Customer"}, user: ${userId}) with code: ${couponCode || "NONE"}, discount: ${discountPercent || 0}%, msg: ${customMessage || "default"}`
    );

    return {
      success: true,
      message: `Recovery email sent successfully to ${userName || userEmail}!`,
    };
  } catch (error) {
    console.error("Failed to send cart recovery email:", error);
    return {
      success: false,
      message: "Failed to send recovery email. Please try again.",
    };
  }
}
