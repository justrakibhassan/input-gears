import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SEARCH_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
};

const searchQuerySchema = z.string().trim().min(1).max(100);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");

  const parsed = searchQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json([], { headers: SEARCH_CACHE_HEADERS });
  }

  const query = parsed.data;

  try {
    // Fuzzy matching with Postgres similarity
    // Using raw SQL because Prisma doesn't natively support trigram similarity yet.
    const rawProducts = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string;
        price: number;
        image: string | null;
        categoryName: string | null;
      }>
    >`
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

    const products = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.image,
      categoryName: p.categoryName || null,
      category: p.categoryName ? { name: p.categoryName } : null,
    }));

    return NextResponse.json(products, { headers: SEARCH_CACHE_HEADERS });
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

      return NextResponse.json(formattedProducts, { headers: SEARCH_CACHE_HEADERS });
    } catch (fallbackError) {
      logger.error("Fallback product search failed", fallbackError, { query });
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}
