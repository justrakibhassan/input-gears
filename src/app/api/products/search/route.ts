import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // Fuzzy matching with Postgres similarity
    // Using raw SQL because Prisma doesn't natively support trigram similarity yet.
    const products = await prisma.$queryRaw`
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.price, 
        p.image,
        c.name as "categoryName"
      FROM products p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE (
        similarity(p.name, ${query}) > 0.2
        OR p.name ILIKE ${"%" + query + "%"}
        OR p.description ILIKE ${"%" + query + "%"}
      )
      AND p."isActive" = true
      AND (p."scheduledAt" IS NULL OR p."scheduledAt" <= NOW())
      ORDER BY similarity(p.name, ${query}) DESC
      LIMIT 8
    `;

    return NextResponse.json(products);
  } catch (error) {
    logger.error("Product search failed", error, { query });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
