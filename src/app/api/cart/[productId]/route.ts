import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { z } from "zod";

const RESERVATION_DURATION_MS = 15 * 60 * 1000;

const patchSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const parsed = patchSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const targetQuantity = parsed.data.quantity;

    const result = await prisma.$transaction(async (tx) => {
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
      });

      if (!existingCartItem) throw new Error("Item not in cart");

      const delta = targetQuantity - existingCartItem.quantity;

      if (targetQuantity < 1) {
        await tx.cartItem.delete({
          where: { id: existingCartItem.id },
        });
        await tx.stockReservation.deleteMany({
          where: { productId, userId: session.user.id },
        });
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: existingCartItem.quantity } },
        });
      } else {
        if (delta > 0) {
          // The WHERE clause is the stock guard, so the check and the
          // decrement can't be interleaved by a concurrent request.
          const { count } = await tx.product.updateMany({
            where: { id: productId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });

          if (count === 0) throw new Error("Insufficient stock");
        } else if (delta < 0) {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: -delta } },
          });
        }

        await tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: targetQuantity },
        });

        await tx.stockReservation.upsert({
          where: { productId_userId: { productId, userId: session.user.id } },
          create: {
            productId,
            userId: session.user.id,
            quantity: targetQuantity,
            expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
          },
          update: {
            quantity: targetQuantity,
            expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
          },
        });
      }
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    logger.error("Cart PATCH Error", error);

    // Only surface the expected business-rule failures, never internals.
    if (message === "Item not in cart" || message === "Insufficient stock") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    await prisma.$transaction(async (tx) => {
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
      });

      if (existingCartItem) {
        await tx.cartItem.delete({
          where: { id: existingCartItem.id },
        });
        await tx.stockReservation.deleteMany({
          where: { productId, userId: session.user.id },
        });
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: existingCartItem.quantity } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
