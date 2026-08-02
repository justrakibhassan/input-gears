import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import type { OrderTotals } from "./totals";

interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    address: string;
    email: string | null;
  };
  userId: string | null;
  totals: OrderTotals;
  paymentMethod: "COD" | "STRIPE";
  isPaid: boolean;
  paymentIntentId: string | null;
}

interface CreateOrderResult {
  orderNumber: string;
  totalAmount: number;
  email: string | null;
  name: string;
  /** False when an order for this payment intent already existed. */
  created: boolean;
}

const UNIQUE_VIOLATION = "P2002";

/**
 * Creates the order, consumes stock atomically and redeems the coupon.
 *
 * Idempotent on stripePaymentIntentId so the client callback and the Stripe
 * webhook can both run this for the same payment without double-charging
 * inventory — whichever loses the race returns the existing order.
 */
export async function createPaidOrRequestedOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const { customer, userId, totals, paymentMethod, isPaid, paymentIntentId } = input;

  if (paymentIntentId) {
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { orderNumber: true, totalAmount: true, email: true, name: true },
    });

    if (existing) {
      return { ...existing, created: false };
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: {
          userId: userId ?? null,
          productId: { in: totals.lineItems.map((l) => l.productId) },
        },
      });
      const reservationByProduct = new Map(reservations.map((r) => [r.productId, r]));

      const order = await tx.order.create({
        data: {
          orderNumber: await generateUniqueOrderNumber(tx),
          userId,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          email: customer.email && customer.email !== "" ? customer.email : null,
          totalAmount: totals.totalCents / 100,
          discountAmount: totals.discountCents / 100,
          shippingAmount: totals.shippingCents / 100,
          taxAmount: totals.taxCents / 100,
          status: isPaid ? "PROCESSING" : "PENDING",
          paymentStatus: isPaid ? "PAID" : "PENDING",
          paymentMethod,
          stripePaymentIntentId: paymentIntentId,
          couponId: totals.couponId,
          items: {
            create: totals.lineItems.map((line) => ({
              productId: line.productId,
              name: line.name,
              price: line.unitPriceCents / 100,
              quantity: line.quantity,
              image: line.image,
            })),
          },
        },
      });

      for (const line of totals.lineItems) {
        const reservation = reservationByProduct.get(line.productId);

        // Reserved units were already removed from stock when added to the cart,
        // so only the difference still needs consuming.
        const decrementBy = reservation
          ? line.quantity - reservation.quantity
          : line.quantity;

        if (decrementBy > 0) {
          // Conditional update: the WHERE clause is the stock guard, so two
          // concurrent orders can't both pass a read-then-write check.
          const { count } = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: decrementBy } },
            data: { stock: { decrement: decrementBy } },
          });

          if (count === 0) {
            throw new OutOfStockError(line.name);
          }
        } else if (decrementBy < 0) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { increment: -decrementBy } },
          });
        }

        if (reservation) {
          await tx.stockReservation.delete({ where: { id: reservation.id } });
        }
      }

      if (totals.couponId) {
        // Conditional redemption so a usage-limited coupon can't be
        // over-redeemed by concurrent checkouts. Raw SQL because the limit is
        // compared against another column on the same row.
        const redeemed = await tx.$executeRaw`
          UPDATE "coupons"
          SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW()
          WHERE "id" = ${totals.couponId}
            AND "isActive" = true
            AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
        `;

        if (redeemed === 0) {
          throw new CouponUnavailableError();
        }
      }

      if (userId) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        email: order.email,
        name: order.name,
        created: true,
      };
    });
  } catch (error) {
    // Lost the idempotency race against the webhook (or vice versa).
    if (
      paymentIntentId &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === UNIQUE_VIOLATION
    ) {
      const existing = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { orderNumber: true, totalAmount: true, email: true, name: true },
      });

      if (existing) {
        logger.info("Order already created for payment intent", { paymentIntentId });
        return { ...existing, created: false };
      }
    }

    throw error;
  }
}

export class OutOfStockError extends Error {
  constructor(productName: string) {
    super(`Insufficient stock for ${productName}`);
  }
}

export class CouponUnavailableError extends Error {
  constructor() {
    super("This coupon is no longer available");
  }
}

async function generateUniqueOrderNumber(
  tx: { order: { findUnique: (args: { where: { orderNumber: string } }) => Promise<unknown> } },
): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `IG${year}${randomBytes(6).toString("hex").toUpperCase()}`;
    const clash = await tx.order.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }

  throw new Error("Could not allocate an order number");
}
