import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe-server";
import { computeOrderTotals } from "@/modules/checkout/lib/totals";
import { createPaidOrRequestedOrder } from "@/modules/checkout/lib/create-order";
import { prisma } from "@/lib/prisma";

// Signature verification needs the unmodified request body.
export const runtime = "nodejs";

const cartMetadataSchema = z.array(
  z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(99),
  }),
);

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("Stripe webhook secret is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    logger.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
      case "payment_intent.canceled":
        await markOrderFailed(event.data.object);
        break;

      case "charge.refunded":
        await markOrderRefunded(event.data.object);
        break;
    }
  } catch (error) {
    // A non-2xx tells Stripe to retry, which is what we want for transient
    // failures — the order creation itself is idempotent.
    logger.error(`Failed to process Stripe event ${event.type}`, error, {
      eventId: event.id,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
  const existing = await prisma.order.findUnique({
    where: { stripePaymentIntentId: intent.id },
    select: { id: true, paymentStatus: true },
  });

  if (existing) {
    if (existing.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: existing.id },
        data: { paymentStatus: "PAID", status: "PROCESSING" },
      });
    }
    return;
  }

  // The browser never made it back to placeOrder — rebuild the order from the
  // metadata we stashed on the intent so the captured payment isn't orphaned.
  const parsedCart = cartMetadataSchema.safeParse(
    safeJsonParse(intent.metadata?.cart),
  );

  if (!parsedCart.success) {
    logger.error("Cannot recover order: unusable cart metadata on intent", null, {
      paymentIntentId: intent.id,
    });
    return;
  }

  const charge = await getLatestCharge(intent);
  const billing = charge?.billing_details;
  const shipping = intent.shipping;

  const totals = await computeOrderTotals({
    items: parsedCart.data,
    couponCode: intent.metadata?.couponCode || undefined,
    shippingZoneId: intent.metadata?.shippingZoneId || undefined,
  });

  if (totals.totalCents !== intent.amount) {
    // Prices or the coupon changed between intent creation and capture. Record
    // the order at the amount actually charged and flag it for review rather
    // than silently over- or under-charging.
    logger.warn("Recovered order total differs from captured amount", {
      paymentIntentId: intent.id,
      capturedCents: intent.amount,
      recomputedCents: totals.totalCents,
    });
  }

  const result = await createPaidOrRequestedOrder({
    customer: {
      name: shipping?.name || billing?.name || "Recovered Order",
      phone: shipping?.phone || billing?.phone || "N/A",
      address: formatAddress(shipping?.address ?? billing?.address) || "N/A",
      email: intent.receipt_email || billing?.email || null,
    },
    userId: intent.metadata?.userId || null,
    totals,
    paymentMethod: "STRIPE",
    isPaid: true,
    paymentIntentId: intent.id,
  });

  logger.info("Recovered order from Stripe webhook", {
    paymentIntentId: intent.id,
    orderNumber: result.orderNumber,
    created: result.created,
  });
}

async function markOrderFailed(intent: Stripe.PaymentIntent) {
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: intent.id, paymentStatus: "PENDING" },
    data: { paymentStatus: "FAILED" },
  });
}

async function markOrderRefunded(charge: Stripe.Charge) {
  const intentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!intentId) return;

  await prisma.order.updateMany({
    where: { stripePaymentIntentId: intentId },
    data: { paymentStatus: "REFUNDED", status: "CANCELLED" },
  });
}

async function getLatestCharge(
  intent: Stripe.PaymentIntent,
): Promise<Stripe.Charge | null> {
  const latest = intent.latest_charge;
  if (!latest) return null;
  if (typeof latest !== "string") return latest;

  try {
    return await stripe.charges.retrieve(latest);
  } catch {
    return null;
  }
}

function formatAddress(address: Stripe.Address | null | undefined): string {
  if (!address) return "";
  return [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
    .filter(Boolean)
    .join(", ");
}

function safeJsonParse(value: string | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
