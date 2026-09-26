import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const getCategorizedBrandsCached = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            brand: true,
          },
          distinct: ["brand"],
          where: {
            brand: { not: null },
            isActive: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      brands: Array.from(
        new Set(cat.products.map((p) => p.brand).filter(Boolean)),
      ),
    }));
  },
  ["categorized-brands"],
  {
    revalidate: 3600,
    tags: ["categories", "brands"],
  }
);

export async function GET() {
  try {
    const categoriesWithBrands = await getCategorizedBrandsCached();

    return NextResponse.json(categoriesWithBrands, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to fetch categorized brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}
