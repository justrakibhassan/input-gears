"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: { category: true }
    });
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    return { success: true, data: product };
  } catch (error) {
    logger.error("Failed to fetch product by id", error, { id });
    return { success: false, error: "Failed to fetch product details" };
  }
}
