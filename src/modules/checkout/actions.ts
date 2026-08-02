"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { sendOrderInvoiceEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe-server";
import { createPaidOrRequestedOrder } from "./lib/create-order";
import { computeOrderTotals, TotalsError } from "./lib/totals";

interface CartItemInput {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

type PaymentMethodInput = "cod" | "stripe";

export async function generateOrderNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = randomBytes(6).toString("hex").toUpperCase();
  return `IG${year}${random}`;
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
      .strip(),
  )
  .min(1)
  .max(100);

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
  shippingZoneId?: string,
) {
  try {
    const validatedForm = placeOrderSchema.parse(formData);
    const validatedCartItems = cartItemsSchema.parse(cartItems);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user;

    const totals = await computeOrderTotals({
      items: validatedCartItems,
      couponCode,
      shippingZoneId,
    });

    const dbPaymentMethod = paymentMethod === "cod" ? "COD" : "STRIPE";
    let isPaid = false;

    if (dbPaymentMethod === "STRIPE") {
      if (!paymentIntentId) {
        throw new Error("Missing payment intent");
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (
        paymentIntent.status !== "succeeded" ||
        paymentIntent.amount !== totals.totalCents ||
        paymentIntent.currency !== "usd"
      ) {
        throw new Error("Payment verification failed");
      }

      isPaid = true;
    }

    const result = await createPaidOrRequestedOrder({
      customer: {
        name: validatedForm.fullName,
        phone: validatedForm.phone,
        address: validatedForm.address,
        email: validatedForm.email || null,
      },
      userId: user?.id ?? null,
      totals,
      paymentMethod: dbPaymentMethod,
      isPaid,
      paymentIntentId: paymentIntentId ?? null,
    });

    if (result.email && result.created) {
      sendOrderInvoiceEmail({
        toEmail: result.email,
        customerName: result.name,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        paymentMethod: dbPaymentMethod,
        // Built from DB-backed line items, never from the client's cart payload.
        items: totals.lineItems.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          price: line.unitPriceCents / 100,
        })),
      }).catch((err) => logger.error("Async invoice email failed", err));
    }

    return { success: true, orderId: result.orderNumber };
  } catch (error) {
    if (error instanceof TotalsError) {
      logger.error("Order totals rejected", error);
      return { success: false, error: error.message };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to place order";
    logger.error("Order Error", error);
    return { success: false, error: errorMessage };
  }
}
