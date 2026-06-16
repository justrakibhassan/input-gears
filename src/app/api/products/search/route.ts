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
    logger.warn("Product search raw trigram query failed, trying standard Prisma fallback search", { error: String(error), query });
    try {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { scheduledAt: null },
                { scheduledAt: { lte: new Date() } }
              ]
            },
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          category: {
            select: {
              name: true
            }
          }
        },
        take: 8
      });

      const formattedProducts = fallbackProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.image,
        categoryName: p.category?.name || null,
        category: p.category ? { name: p.category.name } : null
      }));

      return NextResponse.json(formattedProducts);
    } catch (fallbackError) {
      logger.error("Fallback product search failed", fallbackError, { query });
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}
