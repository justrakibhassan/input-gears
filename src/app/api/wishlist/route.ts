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

    const wishlistItems = await prisma.wishlistItem.findMany({
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
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(wishlistItems.map((item) => item.product));
  } catch (error) {
    logger.error("Failed to fetch wishlist", error);
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
    const { productId, productIds } = body;

    // Handle single item add
    if (productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (productExists) {
        await prisma.wishlistItem.upsert({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId,
            },
          },
          create: {
            userId: session.user.id,
            productId,
          },
          update: {},
        });
      }
    }

    // Handle batch sync (for guest to account migration)
    if (productIds && Array.isArray(productIds)) {
      // Filter out non-existent product IDs to prevent foreign key errors
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const validIds = existingProducts.map((p) => p.id);

      const operations = validIds.map((id) =>
        prisma.wishlistItem.upsert({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId: id,
            },
          },
          create: {
            userId: session.user.id,
            productId: id,
          },
          update: {},
        }),
      );
      await Promise.all(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Wishlist POST Error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
