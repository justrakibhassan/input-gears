"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

interface CartItemInput {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

type PaymentMethodInput = "cod" | "stripe";

export async function generateOrderNumber() {
  let orderNumber = "";
  let isUnique = false;

  while (!isUnique) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = randomBytes(6).toString("hex").toUpperCase();
    orderNumber = `IG${year}${random}`;
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!existingOrder) {
      isUnique = true;
    }
  }

  return orderNumber;
}
interface PlaceOrderFormData {
  fullName: string;
  phone: string;
  address: string;
  email?: string | null;
}

const placeOrderSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(11),
  address: z.string().min(10),
  email: z.string().email("Valid email is required"),
});

const cartItemsSchema = z
  .array(
    z
      .object({
        id: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      })
      .passthrough()
  )
  .min(1);

// --- Coupon Validation ---
export async function validateCoupon(code: string) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { success: false, message: "Invalid coupon code" };
    }

    if (!coupon.isActive) {
      return { success: false, message: "This coupon is no longer active" };
    }

    if (coupon.expiresAt < new Date()) {
      return { success: false, message: "This coupon has expired" };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { success: false, message: "Coupon usage limit reached" };
    }

    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    };
  } catch (error) {
    logger.error("Coupon Validation Error", error);
    return { success: false, message: "Failed to validate coupon" };
  }
}

export async function placeOrder(
  formData: PlaceOrderFormData,
  cartItems: CartItemInput[],
  paymentMethod: PaymentMethodInput,
  paymentIntentId?: string,
  couponCode?: string,
  shippingZoneId?: string
) {
  try {
    const validatedForm = placeOrderSchema.parse(formData);
    const validatedCartItems = cartItemsSchema.parse(cartItems);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user;

    const uniqueProductIds = Array.from(
      new Set(validatedCartItems.map((i) => i.id))
    );

    const [products, shippingZone, settings] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: uniqueProductIds } },
        select: { id: true, name: true, price: true, image: true, stock: true },
      }),
      shippingZoneId
        ? prisma.shippingZone.findUnique({ where: { id: shippingZoneId } })
        : Promise.resolve(null),
      prisma.siteSettings.findUnique({ where: { id: "general" } }),
    ]);

    if (products.length !== uniqueProductIds.length) {
      throw new Error("Invalid cart items");
    }

    const productById = new Map<
      string,
      { id: string; name: string; price: number; image: string | null; stock: number }
    >(products.map((p) => [p.id, p]));
    for (const item of validatedCartItems) {
      const product = productById.get(item.id);
      if (!product) throw new Error("Invalid cart items");
      if (item.quantity > product.stock) throw new Error("Out of stock");
    }

    const subtotalCents = validatedCartItems.reduce((acc, item) => {
      const product = productById.get(item.id)!;
      const unitPriceCents = Math.round(product.price * 100);
      return acc + unitPriceCents * item.quantity;
    }, 0);

    const shippingCents = shippingZone ? Math.round(shippingZone.charge * 100) : (subtotalCents > 100000 ? 0 : 6000);
    const taxRate = settings?.taxRate ?? 0;
    const taxCents = Math.round(subtotalCents * (taxRate / 100));

    // --- Coupon Application ---
    let discountCents = 0;
    let couponId: string | null = null;
    
    if (couponCode) {
      const couponRes = await validateCoupon(couponCode);
      if (couponRes.success && couponRes.coupon) {
        couponId = couponRes.coupon.id;
        if (couponRes.coupon.type === "PERCENTAGE") {
          discountCents = Math.round(subtotalCents * (couponRes.coupon.value / 100));
        } else {
          discountCents = Math.round(couponRes.coupon.value * 100);
        }
      }
    }

    const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents + taxCents);

    const dbPaymentMethod = paymentMethod === "cod" ? "COD" : "STRIPE";
    let isPaid = false;

    // --- 1. Stripe Verification (Outside Transaction) ---
    if (dbPaymentMethod === "STRIPE") {
      if (!paymentIntentId) {
        throw new Error("Missing payment intent");
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-12-15.clover",
        typescript: true,
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (
        paymentIntent.status !== "succeeded" ||
        paymentIntent.amount !== totalCents ||
        paymentIntent.currency !== "usd"
      ) {
        throw new Error("Payment verification failed");
      }

      isPaid = true;
    }

    // --- 2. Order Number Generation (Outside Transaction) ---
    const newOrderNumber = await generateOrderNumber();

    // --- 3. Atomic Database Operations (Simplified Transaction) ---
    // Merge duplicate product items in cart to prevent multiple redundant updates
    const mergedCartItems = validatedCartItems.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (existing) {
        existing.quantity += current.quantity;
      } else {
        acc.push({ ...current });
      }
      return acc;
    }, [] as typeof validatedCartItems);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch reservations for this user and these products
      const reservations = await tx.stockReservation.findMany({
        where: {
          userId: user?.id || null,
          productId: { in: uniqueProductIds },
        },
      });

      const reservationMap = new Map(reservations.map(r => [r.productId, r]));

      // 2. Verified Stock Check (Accounting for reservations)
      for (const item of mergedCartItems) {
        const product = productById.get(item.id);
        const reservation = reservationMap.get(item.id);
        if (!product) throw new Error("Invalid cart items");
        
        const effectiveStock = product.stock + (reservation?.quantity || 0);
        if (item.quantity > effectiveStock) throw new Error(`Out of stock for ${product.name}`);
      }

      // 3. Create the order and items
      const order = await tx.order.create({
        data: {
          orderNumber: newOrderNumber,
          userId: user?.id || null,
          name: validatedForm.fullName,
          phone: validatedForm.phone,
          address: validatedForm.address,
          email:
            validatedForm.email && validatedForm.email !== ""
              ? validatedForm.email
              : null,
          totalAmount: totalCents / 100,
          discountAmount: discountCents / 100,
          shippingAmount: shippingCents / 100,
          taxAmount: taxCents / 100,
          status: isPaid ? "PROCESSING" : "PENDING",
          paymentStatus: isPaid ? "PAID" : "PENDING",
          paymentMethod: dbPaymentMethod,
          stripePaymentIntentId: paymentIntentId || null,
          couponId: couponId,
          items: {
            create: mergedCartItems.map((item) => {
              const product = productById.get(item.id)!;
              return {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image || null,
              };
            }),
          },
        },
      });

      // 4. Update product stocks or consume reservations
      for (const item of mergedCartItems) {
        const reservation = reservationMap.get(item.id);

        try {
          if (reservation) {
            // Stock was already decremented on Add to Cart, just delete reservation
            // If the reservation quantity is different, adjust the stock
            const delta = item.quantity - reservation.quantity;
            if (delta !== 0) {
              await tx.product.update({
                where: { id: item.id },
                data: { stock: { decrement: delta } },
              });
            }
            await tx.stockReservation.delete({
              where: { id: reservation.id },
            });
          } else {
            // No reservation found (flow bypassed or expired), decrement stock normally
            await tx.product.update({
              where: { id: item.id },
              data: { stock: { decrement: item.quantity } },
            });
          }
        } catch (updateError) {
          logger.error(`Failed to consume reservation/update stock for product ${item.id}`, updateError);
          throw updateError; // Rethrow to rollback transaction
        }
      }

      // Update coupon usage if applicable
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // 5. Clear the user's cart
      if (user?.id) {
        await tx.cartItem.deleteMany({
          where: { userId: user.id },
        });
      }

      return { orderNumber: order.orderNumber };
    });

    return { success: true, orderId: result.orderNumber };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to place order";
    logger.error("Order Error", error);
    return { success: false, error: errorMessage };
  }
}
