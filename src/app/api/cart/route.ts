import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { z } from "zod";

const RESERVATION_DURATION_MS = 15 * 60 * 1000;

// quantity is min(0) — never negative. A negative value would invert the
// `decrement` below and inflate stock instead of consuming it.
const cartPostSchema = z
  .object({
    productId: z.string().min(1).optional(),
    quantity: z.number().int().min(0).max(99).optional(),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          quantity: z.number().int().min(0).max(99),
        }),
      )
      .max(100)
      .optional(),
  })
  .refine((data) => data.productId !== undefined || data.items !== undefined, {
    message: "Either productId or items is required",
  });

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
    const parsed = cartPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { productId, quantity, items } = parsed.data;

    // Handle single item add/update with stock reservation
    if (productId) {
      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true },
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
        const targetQuantity = quantity !== undefined ? quantity : currentQuantity + 1;
        const delta = targetQuantity - currentQuantity;

        if (targetQuantity === 0) {
          // Emptying the line returns the reserved units to stock.
          if (currentQuantity > 0) {
            await tx.product.update({
              where: { id: productId },
              data: { stock: { increment: currentQuantity } },
            });
          }
          await tx.cartItem.deleteMany({
            where: { userId: session.user.id, productId },
          });
          await tx.stockReservation.deleteMany({
            where: { userId: session.user.id, productId },
          });
          return { quantity: 0 };
        }

        if (delta > 0) {
          // The WHERE clause is the stock guard, so concurrent adds can't both
          // pass a separate read-then-write check and drive stock negative.
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
    if (items) {
      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

      for (const item of items) {
        if (item.quantity === 0) continue;

        try {
          await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
              where: { id: item.id },
              select: { id: true },
            });

            if (!product) return;

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
              return;
            }

            if (delta > 0) {
              const { count } = await tx.product.updateMany({
                where: { id: item.id, stock: { gte: delta } },
                data: { stock: { decrement: delta } },
              });

              // Not enough stock for this line — skip it and keep syncing the rest.
              if (count === 0) return;
            } else {
              await tx.product.update({
                where: { id: item.id },
                data: { stock: { increment: -delta } },
              });
            }

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
          });
        } catch (itemError) {
          logger.error(`Failed to sync cart item for product ${item.id}`, itemError);
        }
      }
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
