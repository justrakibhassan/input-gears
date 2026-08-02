import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe-server";
import { computeOrderTotals, TotalsError } from "@/modules/checkout/lib/totals";

const requestSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            quantity: z.number().int().positive().max(99),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    couponCode: z.string().trim().min(1).max(64).optional(),
    shippingZoneId: z.string().min(1).optional(),
    paymentIntentId: z.string().min(1).optional(),
  })
  .strict();

export async function POST(req: Request) {
  let userId: string | undefined;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    userId = session?.user?.id;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { items, couponCode, shippingZoneId, paymentIntentId } = parsed.data;

    const totals = await computeOrderTotals({
      items,
      couponCode,
      shippingZoneId,
    });

    // The webhook is the authoritative order-creation path, so it needs enough
    // context to build the order without the browser.
    const metadata: Record<string, string> = {
      userId: userId ?? "",
      couponCode: totals.couponCode ?? "",
      shippingZoneId: shippingZoneId ?? "",
      cart: JSON.stringify(
        totals.lineItems.map((l) => ({ id: l.productId, quantity: l.quantity })),
      ),
    };

    // Reuse the existing intent when the cart changes, so a customer editing
    // their order doesn't leave a trail of orphaned intents.
    if (paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (existing.status === "succeeded") {
        return NextResponse.json(
          { error: "This payment has already been completed" },
          { status: 409 },
        );
      }

      if (["requires_payment_method", "requires_confirmation"].includes(existing.status)) {
        const updated = await stripe.paymentIntents.update(paymentIntentId, {
          amount: totals.totalCents,
          metadata,
        });

        return NextResponse.json({
          clientSecret: updated.client_secret,
          paymentIntentId: updated.id,
          totalCents: totals.totalCents,
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totals.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalCents: totals.totalCents,
    });
  } catch (error) {
    if (error instanceof TotalsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("Failed to create payment intent", error, { userId });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
