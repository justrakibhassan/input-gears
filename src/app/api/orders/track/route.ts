import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trackQuerySchema = z.object({
  orderNumber: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  contact: z.string().trim().min(3).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = trackQuerySchema.safeParse({
      orderNumber: searchParams.get("orderNumber") || undefined,
      contact: searchParams.get("contact") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid Order Number and Phone/Email are required" },
        { status: 400 }
      );
    }

    const { orderNumber, contact } = parsed.data;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: "insensitive" },
        OR: [
          { phone: { equals: contact, mode: "insensitive" } },
          { email: { equals: contact, mode: "insensitive" } },
        ],
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            image: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No matching order found for the provided details." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      name: order.name,
      address: order.address,
      createdAt: order.createdAt,
      items: order.items,
    });
  } catch (error) {
    console.error("Order tracking API error:", error);
    return NextResponse.json(
      { error: "Server error tracking order" },
      { status: 500 }
    );
  }
}
