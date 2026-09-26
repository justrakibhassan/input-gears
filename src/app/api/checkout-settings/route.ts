import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";

const getCheckoutSettingsCached = unstable_cache(
  async () => {
    const [zones, settings] = await Promise.all([
      prisma.shippingZone.findMany({ orderBy: { name: "asc" } }),
      prisma.siteSettings.findUnique({ where: { id: "general" } }),
    ]);

    return {
      zones,
      taxRate: settings?.taxRate ?? 0,
    };
  },
  ["checkout-settings"],
  {
    revalidate: 300,
    tags: ["checkout-settings", "settings"],
  }
);

export async function GET() {
  try {
    const data = await getCheckoutSettingsCached();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch checkout settings", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}
