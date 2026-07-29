import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const contact = searchParams.get("contact")?.trim(); // phone or email

    if (!orderNumber || !contact) {
      return NextResponse.json(
        { error: "Order Number and Phone/Email are required" },
        { status: 400 }
      );
    }

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
