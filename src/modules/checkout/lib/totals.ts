import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const FREE_SHIPPING_THRESHOLD_CENTS = 100_000;
export const DEFAULT_SHIPPING_CENTS = 6_000;

export interface TotalsInput {
  items: { id: string; quantity: number }[];
  couponCode?: string | null;
  shippingZoneId?: string | null;
}

export interface TotalsLineItem {
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPriceCents: number;
  stock: number;
}

export interface OrderTotals {
  lineItems: TotalsLineItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  couponId: string | null;
  couponCode: string | null;
  couponError: string | null;
  taxRate: number;
}

export class TotalsError extends Error {}

/**
 * An active sale only counts while it has no end date or the end date is still
 * in the future — an expired sale must fall back to the list price.
 */
export function getEffectivePriceCents(
  product: {
    price: number;
    isOnSale: boolean;
    salePrice: number | null;
    saleEndDate: Date | null;
  },
  now: Date,
): number {
  const onSale =
    product.isOnSale &&
    product.salePrice !== null &&
    product.salePrice > 0 &&
    (product.saleEndDate === null || product.saleEndDate > now);

  return Math.round((onSale ? product.salePrice! : product.price) * 100);
}

/**
 * Single source of truth for order money. The payment intent, the order row and
 * the amounts shown to the customer must all come from here, or Stripe's
 * captured amount won't match the order total and the charge gets orphaned.
 */
export async function computeOrderTotals(
  input: TotalsInput,
  client: Prisma.TransactionClient = prisma,
  now: Date = new Date(),
): Promise<OrderTotals> {
  const { items, couponCode, shippingZoneId } = input;

  if (items.length === 0) {
    throw new TotalsError("Cart is empty");
  }

  // Merge duplicate lines up front so stock checks and totals see one row per product.
  const mergedQuantities = new Map<string, number>();
  for (const item of items) {
    mergedQuantities.set(
      item.id,
      (mergedQuantities.get(item.id) ?? 0) + item.quantity,
    );
  }
  const uniqueProductIds = [...mergedQuantities.keys()];

  const [products, shippingZone, settings] = await Promise.all([
    client.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        stock: true,
        isActive: true,
        isOnSale: true,
        salePrice: true,
        saleEndDate: true,
      },
    }),
    shippingZoneId
      ? client.shippingZone.findUnique({ where: { id: shippingZoneId } })
      : Promise.resolve(null),
    client.siteSettings.findUnique({ where: { id: "general" } }),
  ]);

  if (products.length !== uniqueProductIds.length) {
    throw new TotalsError("One or more items are invalid");
  }

  const lineItems: TotalsLineItem[] = [];
  for (const product of products) {
    if (!product.isActive) {
      throw new TotalsError(`${product.name} is no longer available`);
    }

    const quantity = mergedQuantities.get(product.id)!;
    if (quantity > product.stock) {
      throw new TotalsError(`Insufficient stock for ${product.name}`);
    }

    lineItems.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity,
      unitPriceCents: getEffectivePriceCents(product, now),
      stock: product.stock,
    });
  }

  const subtotalCents = lineItems.reduce(
    (acc, item) => acc + item.unitPriceCents * item.quantity,
    0,
  );

  let discountCents = 0;
  let couponId: string | null = null;
  let resolvedCouponCode: string | null = null;
  let couponError: string | null = null;

  if (couponCode) {
    const coupon = await client.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      couponError = "Invalid coupon code";
    } else if (!coupon.isActive) {
      couponError = "This coupon is no longer active";
    } else if (coupon.expiresAt < now) {
      couponError = "This coupon has expired";
    } else if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      couponError = "Coupon usage limit reached";
    } else {
      couponId = coupon.id;
      resolvedCouponCode = coupon.code;
      const raw =
        coupon.type === "PERCENTAGE"
          ? Math.round(subtotalCents * (coupon.value / 100))
          : Math.round(coupon.value * 100);
      // A fixed-value coupon must never exceed the subtotal, or shipping and
      // tax would end up being paid for by the discount.
      discountCents = Math.min(Math.max(0, raw), subtotalCents);
    }
  }

  const discountedSubtotalCents = subtotalCents - discountCents;

  const shippingCents = shippingZone
    ? Math.round(shippingZone.charge * 100)
    : discountedSubtotalCents > FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : DEFAULT_SHIPPING_CENTS;

  const taxRate = settings?.taxRate ?? 0;
  const taxCents = Math.round(discountedSubtotalCents * (taxRate / 100));

  const totalCents = discountedSubtotalCents + shippingCents + taxCents;

  return {
    lineItems,
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
    couponId,
    couponCode: resolvedCouponCode,
    couponError,
    taxRate,
  };
}
