"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const idPattern = /^[a-zA-Z0-9_-]+$/;
const idSchema = z.string().trim().min(1).max(64).regex(idPattern);
const idsSchema = z.array(idSchema).min(1).max(100);

export async function getProductById(id: string) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: "Invalid product identifier" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data, isActive: true },
      include: { category: true },
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

export async function getProductsByIds(ids: string[]) {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) {
    return { success: false, error: "Invalid product identifiers" };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: parsed.data },
        isActive: true,
      },
      include: { category: true },
    });
    return { success: true, data: products };
  } catch (error) {
    logger.error("Failed to fetch products by ids", error, { ids });
    return { success: false, error: "Failed to fetch products details" };
  }
}
