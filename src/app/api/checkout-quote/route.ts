import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { computeOrderTotals, TotalsError } from "@/modules/checkout/lib/totals";

const quoteSchema = z
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
  })
  .strict();

/**
 * Returns the authoritative money breakdown for a cart so the summary the
 * customer sees matches what they'll actually be charged.
 */
export async function POST(req: Request) {
  try {
    const parsed = quoteSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const totals = await computeOrderTotals(parsed.data);

    return NextResponse.json({
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxRate: totals.taxRate,
      couponCode: totals.couponCode,
      couponError: totals.couponError,
      lineItems: totals.lineItems.map((line) => ({
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
      })),
    });
  } catch (error) {
    if (error instanceof TotalsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("Failed to build checkout quote", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
