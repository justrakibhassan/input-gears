import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  items: z
    .array(
      z
        .object({
          id: z.string().min(1),
          quantity: z.number().int().positive().max(99),
        })
        .strict(), // Reject unknown fields for security
    )
    .min(1),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

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

    const items = parsed.data.items;
    const uniqueProductIds = Array.from(new Set(items.map((i) => i.id)));
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true, price: true, stock: true },
    });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = uniqueProductIds.filter(
        (id) => !foundIds.includes(id),
      );
      console.error("Invalid product IDs in cart:", missingIds);
      return NextResponse.json(
        { error: "One or more items are invalid" },
        { status: 400 },
      );
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productById.get(item.id);
      if (!product) {
        return NextResponse.json(
          { error: "One or more items are invalid" },
          { status: 400 },
        );
      }
      if (item.quantity > product.stock) {
        return NextResponse.json(
          { error: "One or more items are out of stock" },
          { status: 400 },
        );
      }
    }

    const subtotalCents = items.reduce((acc, item) => {
      const product = productById.get(item.id)!;
      const unitPriceCents = Math.round(product.price * 100);
      return acc + unitPriceCents * item.quantity;
    }, 0);

    const shippingCents = subtotalCents > 100000 ? 0 : 6000;
    const totalCents = subtotalCents + shippingCents;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error("Failed to create payment intent", error, {
      userId,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
