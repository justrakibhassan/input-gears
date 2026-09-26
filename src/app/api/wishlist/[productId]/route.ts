import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const paramSchema = z.object({
  productId: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
});

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

    const rawParams = await params;
    const parsedParams = paramSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid product identifier" }, { status: 400 });
    }

    const { productId } = parsedParams.data;

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wishlist DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
