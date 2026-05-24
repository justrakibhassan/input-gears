import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            image: true,
            stock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      cartItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        image: item.product.image || "",
        quantity: item.quantity,
        maxStock: item.product.stock,
      })),
    );
  } catch (error) {
    logger.error("Failed to fetch cart", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity, items } = body;

    // Handle single item add/update with stock reservation
    if (productId) {
      const reservationDuration = 15 * 60 * 1000; // 15 minutes
      const expiresAt = new Date(Date.now() + reservationDuration);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Get product and current cart item to calculate quantity delta
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, stock: true },
        });

        if (!product) throw new Error("Product not found");

        const existingCartItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId,
            },
          },
        });

        const currentQuantity = existingCartItem?.quantity || 0;
        const targetQuantity = quantity || currentQuantity + 1;
        const delta = targetQuantity - currentQuantity;

        // 2. Check stock availability
        if (delta > 0 && product.stock < delta) {
          throw new Error("Insufficient stock");
        }

        // 3. Update stock and cart item
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: delta } },
        });

        const cartItem = await tx.cartItem.upsert({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId,
            },
          },
          create: {
            userId: session.user.id,
            productId,
            quantity: targetQuantity,
          },
          update: {
            quantity: targetQuantity,
          },
        });

        // 4. Create or update stock reservation
        await tx.stockReservation.upsert({
          where: {
            productId_userId: {
              productId,
              userId: session.user.id,
            },
          },
          create: {
            productId,
            userId: session.user.id,
            quantity: targetQuantity,
            expiresAt,
          },
          update: {
            quantity: targetQuantity,
            expiresAt,
          },
        });

        return cartItem;
      });

      if (!result) {
        return NextResponse.json(
          { error: "Failed to update cart" },
          { status: 400 },
        );
      }
    }

    interface CartInputItem {
      id: string;
      quantity: number;
    }

    // Handle batch sync (for guest to account migration) with stock reservation
    if (items && Array.isArray(items)) {
      const reservationDuration = 15 * 60 * 1000;
      const expiresAt = new Date(Date.now() + reservationDuration);

      await prisma.$transaction(async (tx) => {
        for (const item of items as CartInputItem[]) {
          const product = await tx.product.findUnique({
            where: { id: item.id },
            select: { id: true, stock: true },
          });

          if (!product) continue;

          const existingCartItem = await tx.cartItem.findUnique({
            where: {
              userId_productId: {
                userId: session.user.id,
                productId: item.id,
              },
            },
          });

          const currentQuantity = existingCartItem?.quantity || 0;
          const targetQuantity = item.quantity;
          const delta = targetQuantity - currentQuantity;

          // Simple guard: if delta is 0, just touch reservation expiry
          if (delta === 0) {
            await tx.stockReservation.upsert({
              where: {
                productId_userId: {
                  productId: item.id,
                  userId: session.user.id,
                },
              },
              create: {
                productId: item.id,
                userId: session.user.id,
                quantity: targetQuantity,
                expiresAt,
              },
              update: { expiresAt },
            });
            continue;
          }

          // Check stock availability for increase
          if (delta > 0 && product.stock < delta) {
            continue;
          }

          // Update stock and cart
          await tx.product.update({
            where: { id: item.id },
            data: { stock: { decrement: delta } },
          });

          await tx.cartItem.upsert({
            where: {
              userId_productId: { userId: session.user.id, productId: item.id },
            },
            create: {
              userId: session.user.id,
              productId: item.id,
              quantity: targetQuantity,
            },
            update: { quantity: targetQuantity },
          });

          await tx.stockReservation.upsert({
            where: {
              productId_userId: {
                productId: item.id,
                userId: session.user.id,
              },
            },
            create: {
              productId: item.id,
              userId: session.user.id,
              quantity: targetQuantity,
              expiresAt,
            },
            update: { quantity: targetQuantity, expiresAt },
          });
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Cart POST Error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
