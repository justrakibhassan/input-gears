import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const { quantity } = await req.json();

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity)) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current cart item
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
      });

      if (!existingCartItem) throw new Error("Item not in cart");

      const delta = parsedQuantity - existingCartItem.quantity;

      // 2. If quantity is 0 or less, delete
      if (parsedQuantity < 1) {
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
        // 3. Just update
        // Check stock if increasing
        if (delta > 0) {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stock: true },
          });
          if (!product || product.stock < delta) throw new Error("Insufficient stock");
        }

        await tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: parsedQuantity },
        });

        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: delta } },
        });

        await tx.stockReservation.upsert({
          where: { productId_userId: { productId, userId: session.user.id } },
          create: {
            productId,
            userId: session.user.id,
            quantity: parsedQuantity,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
          update: {
            quantity: parsedQuantity,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
      }
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cart PATCH Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
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
