"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { createAuditLog } from "./actions/audit-actions";
import { logger } from "@/lib/logger";

async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = session?.user?.role as UserRole;

  if (!session?.user || !allowedRoles.includes(userRole)) {
    throw new Error("Unauthorized");
  }

  return session;
}

// --- 1. Product Schema Update ---
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description is too short"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  colors: z.array(z.string()).default([]),
  switchType: z.string().optional(),
  brand: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  dpi: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  connectionType: z.string().optional().nullable(),
  pollingRate: z.string().optional().nullable(),
  sensor: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable(),
  specs: z
    .record(z.string(), z.string().or(z.number()).or(z.boolean()).nullable())
    .optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// --- 2. Create Product (Updated) ---
export async function createProduct(data: ProductFormValues) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
    const validatedData = productSchema.parse(data);

    // Check if slug exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return {
        success: false,
        message: "Slug already exists. Try a different name.",
      };
    }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        image: validatedData.image || null,
        categoryId: validatedData.categoryId,
        colors: validatedData.colors,
        switchType: validatedData.switchType,
        brand: validatedData.brand,
        sku: validatedData.sku,
        dpi: validatedData.dpi,
        weight: validatedData.weight,
        connectionType: validatedData.connectionType,
        pollingRate: validatedData.pollingRate,
        sensor: validatedData.sensor,
        warranty: validatedData.warranty,
        availability: validatedData.availability,
        isActive: validatedData.isActive,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
        specs: validatedData.specs || {},
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");

    await createAuditLog({
      adminId: session.user.id,
      action: "CREATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: product.id,
      details: `Created product "${product.name}" with price ${product.price}`,
    });

    return {
      success: true,
      message: "Product created successfully!",
      productId: product.id,
    };
  } catch (error) {
    logger.error("Create Product Error:", error);
    return { success: false, message: "Failed to create product" };
  }
}

// --- 3. Update Product (Updated) ---
export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
    // Validation
    const validatedData = productSchema.parse(data);

    // Slug unique check
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: validatedData.slug,
        NOT: { id: id },
      },
    });

    if (existingProduct) {
      return {
        success: false,
        message: "Slug already exists. Try a different name.",
      };
    }

    // Get old product for logging details
    const oldProduct = await prisma.product.findUnique({
      where: { id },
    });

    // Update Query
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        image: validatedData.image || null,
        categoryId: validatedData.categoryId,
        colors: validatedData.colors,
        switchType: validatedData.switchType,
        brand: validatedData.brand,
        sku: validatedData.sku,
        dpi: validatedData.dpi,
        weight: validatedData.weight,
        connectionType: validatedData.connectionType,
        pollingRate: validatedData.pollingRate,
        sensor: validatedData.sensor,
        warranty: validatedData.warranty,
        availability: validatedData.availability,
        isActive: validatedData.isActive,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
        specs: validatedData.specs || {},
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

    if (oldProduct) {
      let details = `Updated product "${updatedProduct.name}"`;
      if (oldProduct.price !== updatedProduct.price) {
        details += `. Price changed from ${oldProduct.price} to ${updatedProduct.price}`;
      }
      
      await createAuditLog({
        adminId: session.user.id,
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: id,
        details,
      });
    }

    return { success: true, message: "Product updated successfully!" };
  } catch (error) {
    logger.error("Update Product Error:", error);
    return { success: false, message: "Failed to update product" };
  }
}

// --- Category Actions (Same as before) ---
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image: z.string().optional().or(z.literal("")),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    await requireRole(["SUPER_ADMIN", "CONTENT_EDITOR"]);
    const validated = categorySchema.parse(data);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return { success: false, message: "Slug already exists!" };
    }

    await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        image: validated.image || null,
        isActive: true,
      },
    });

    revalidatePath("/admin/categories");
    // Necessary for dropdown refresh if using server components
    revalidatePath("/admin/products/create");

    return { success: true, message: "Category created successfully!" };
  } catch (error) {
    logger.error("Failed to create category", error);
    return { success: false, message: "Failed to create category" };
  }
}

export async function getCategoriesOptions() {
  await requireRole(["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"]);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return categories;
}

// --- Order Actions (Same as before) ---
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
    const status = z.nativeEnum(OrderStatus).parse(newStatus);

    await prisma.order.update({
      where: { id: orderId },
      data: { status: status },
    });

    revalidatePath("/admin/orders");

    await createAuditLog({
      adminId: session.user.id,
      action: "ORDER_STATUS_UPDATE",
      entityType: "ORDER",
      entityId: orderId,
      details: `Changed status of order to ${status}`,
    });

    return { success: true, message: "Order status updated successfully!" };
  } catch (error) {
    logger.error("Status Update Error:", error);
    return { success: false, message: "Failed to update status." };
  }
}
//Site Settings Actions
interface HeroSlideInput {
  title?: string;
  subtitle?: string;
  image: string;
  link?: string;
}

// --- 1. Get Data ---
export async function getStoreAppearance() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "general" },
  });

  // --- Top Bar Logic (Kept as is) ---
  let isTopBarActive = settings?.topBarActive ?? false;

  if (settings?.topBarStart || settings?.topBarEnd) {
    const now = new Date();
    if (settings.topBarStart && now < settings.topBarStart)
      isTopBarActive = false;
    if (settings.topBarEnd && now > settings.topBarEnd) isTopBarActive = false;
  }

  const finalSettings = settings
    ? { ...settings, topBarActive: isTopBarActive }
    : null;

  // --- Hero Slides (Simple Fetch) ---
  const slides = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  });

  const brandLogos = await prisma.brandLogo.findMany({
    orderBy: { order: "asc" },
  });

  return {
    settings: finalSettings,
    slides: slides,
    brandLogos,
  };
}

interface TopBarInput {
  text: string;
  link: string;
  isActive: boolean;
  // UI logic field
  useSchedule: boolean;
  topBarStart?: string;
  topBarEnd?: string;
}

// --- 2. Update Top Bar ---
export async function updateTopBar(data: TopBarInput) {
  await requireRole(["SUPER_ADMIN"]);
  // Logic:
  // Handle scheduling

  const startDate =
    data.useSchedule && data.topBarStart ? new Date(data.topBarStart) : null;
  const endDate =
    data.useSchedule && data.topBarEnd ? new Date(data.topBarEnd) : null;

  await prisma.siteSettings.upsert({
    where: { id: "general" },
    update: {
      topBarText: data.text,
      topBarLink: data.link,
      topBarActive: data.isActive,
      topBarStart: startDate,
      topBarEnd: endDate,
    },
    create: {
      id: "general",
      topBarText: data.text,
      topBarLink: data.link,
      topBarActive: data.isActive,
      topBarStart: startDate,
      topBarEnd: endDate,
    },
  });

  revalidatePath("/");
  return { success: true };
}
// --- 3. Update Hero Slides (Reverted to Simple Version) ---
export async function updateHeroSlides(slides: HeroSlideInput[]) {
  await requireRole(["SUPER_ADMIN", "CONTENT_EDITOR"]);
  await prisma.heroSlide.deleteMany();

  if (slides.length > 0) {
    await prisma.heroSlide.createMany({
      data: slides.map((s, i) => ({
        title: s.title || "",
        subtitle: s.subtitle,
        image: s.image,
        link: s.link,
        order: i,
        // ❌ No scheduledStart/End here
      })),
    });
  }

  revalidatePath("/");
  return { success: true };
}

// --- Brand Logos Actions ---
export interface BrandLogoInput {
  name: string;
  image: string;
  isActive: boolean;
}

export async function updateBrandLogos(brands: BrandLogoInput[]) {
  await requireRole(["SUPER_ADMIN", "CONTENT_EDITOR"]);
  await prisma.brandLogo.deleteMany();

  if (brands.length > 0) {
    await prisma.brandLogo.createMany({
      data: brands.map((b, i) => ({
        name: b.name,
        image: b.image,
        isActive: b.isActive,
        order: i,
      })),
    });
  }

  revalidatePath("/");
  return { success: true };
}



// --- 4. Bulk Delete Orders ---
export async function deleteOrders(orderIds: string[]) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);

    await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
      },
    });

    revalidatePath("/admin/orders");

    await createAuditLog({
      adminId: session.user.id,
      action: "ORDER_DELETE",
      entityType: "ORDER",
      entityId: "BULK",
      details: `Deleted orders: ${orderIds.join(", ")}`,
    });

    return {
      success: true,
      message: `${orderIds.length} orders deleted successfully`,
    };
  } catch (error) {
    logger.error("Bulk Delete Error:", error);
    return { success: false, message: "Failed to delete orders" };
  }
}
// --- 5. Bulk Delete Products ---
export async function deleteProducts(productIds: string[]) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);

    await prisma.product.deleteMany({
      where: {
        id: { in: productIds },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");

    await createAuditLog({
      adminId: session.user.id,
      action: "PRODUCT_DELETE",
      entityType: "PRODUCT",
      entityId: "BULK",
      details: `Deleted products: ${productIds.join(", ")}`,
    });

    return {
      success: true,
      message: `${productIds.length} products deleted successfully`,
    };
  } catch (error) {
    logger.error("Bulk Delete Products Error:", error);
    return { success: false, message: "Failed to delete products" };
  }
}
// --- 6. Bulk Delete Users ---
export async function deleteUsers(userIds: string[]) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);

    await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    revalidatePath("/admin/customers");
    
    await createAuditLog({
      adminId: session.user.id,
      action: "USER_DELETE",
      entityType: "USER",
      entityId: "BULK",
      details: `Deleted users: ${userIds.join(", ")}`,
    });

    return {
      success: true,
      message: `${userIds.length} customers deleted successfully`,
    };
  } catch (error) {
    logger.error("Bulk Delete Users Error:", error);
    return { success: false, message: "Failed to delete users" };
  }
}

// --- 7. Update User ---
const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["USER", "MANAGER", "CONTENT_EDITOR", "SUPER_ADMIN"]),
  phone: z.string().optional().nullable(),
});

export async function updateUser(
  id: string,
  data: z.infer<typeof userUpdateSchema>,
) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    const validated = userUpdateSchema.parse(data);

    await prisma.user.update({
      where: { id },
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        phone: validated.phone,
      },
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${id}`);

    await createAuditLog({
      adminId: session.user.id,
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: id,
      details: `Updated info for user "${validated.name}" (${validated.role})`,
    });

    return { success: true, message: "User updated successfully!" };
  } catch (error) {
    logger.error("Update User Error:", error);
    return { success: false, message: "Failed to update user" };
  }
}

// --- 8. Maintenance Mode Actions ---
interface SiteSettingsWithMaintenance {
  maintenanceMode: boolean;
}

export async function getMaintenanceMode() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "general" },
    });
    return (settings as unknown as SiteSettingsWithMaintenance)?.maintenanceMode ?? false;
  } catch (error) {
    logger.error("Get Maintenance Error:", error);
    return false;
  }
}

export async function getSettingsPageData() {
  await requireRole(["SUPER_ADMIN"]);
  const [maintenanceMode, coupons, shippingZones, settings] = await Promise.all([
    getMaintenanceMode(),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.shippingZone.findMany({ orderBy: { name: "asc" } }),
    prisma.siteSettings.findUnique({ where: { id: "general" } }),
  ]);
  return { 
    maintenanceMode, 
    coupons, 
    shippingZones,
    taxRate: settings?.taxRate ?? 0
  };
}

export async function updateMaintenanceMode(enabled: boolean) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    await prisma.siteSettings.upsert({
      where: { id: "general" },
      // Since 'npx prisma generate' is currently blocked by file locks, we use a targeted cast
      // to allow the new field while maintaining structure.
      update: { maintenanceMode: enabled } as Record<string, boolean>,
      create: { id: "general", maintenanceMode: enabled } as Record<string, string | boolean>,
    });
    return { success: true };
  } catch (error) {
    logger.error("Update Maintenance Error:", error);
    return { success: false, message: "Failed to update maintenance mode" };
  }
}

// --- 9. Coupon Management Actions ---
export async function getCoupons() {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);
    return await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("Get Coupons Error:", error);
    return [];
  }
}

export async function createCoupon(data: {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  expiresAt: Date;
  usageLimit?: number;
}) {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);
    await prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
    });

    await createAuditLog({
      adminId: (await requireRole(["SUPER_ADMIN", "MANAGER"])).user.id,
      action: "COUPON_CREATE",
      entityType: "COUPON",
      entityId: data.code,
      details: `Created coupon "${data.code}" with value ${data.value} (${data.type})`,
    });

    return { success: true };
  } catch (error) {
    logger.error("Create Coupon Error:", error);
    return { success: false, message: "Failed to create coupon. Maybe the code already exists?" };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);
    await prisma.coupon.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    logger.error("Delete Coupon Error:", error);
    return { success: false, message: "Failed to delete coupon" };
  }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);
    await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  } catch (error) {
    logger.error("Toggle Coupon Error:", error);
    return { success: false, message: "Failed to update coupon status" };
  }
}

// --- 10. Analytics Actions ---
export async function getRevenueAnalytics() {
  try {
    await requireRole(["SUPER_ADMIN"]);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const revenueByDay = orders.reduce((acc, order) => {
      const day = order.createdAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = last7Days.map((day) => {
      const date = new Date(day);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      return {
        name: dayName,
        revenue: revenueByDay[day] || 0,
      };
    });

    return chartData;
  } catch (error) {
    logger.error("Get Revenue Analytics Error:", error);
    return [];
  }
}

// --- 11. Inventory & Stock Control Actions ---

/**
 * Fetch products with stock below threshold (default 5)
 */
export async function getLowStockProducts(threshold: number = 5) {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);

    return await prisma.product.findMany({
      where: {
        stock: {
          lt: threshold,
        },
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: {
        stock: "asc",
      },
    });
  } catch (error) {
    logger.error("Get Low Stock Error:", error);
    return [];
  }
}

/**
 * Bulk update stock for multiple products and log the changes
 */
export async function updateStockBulk(
  updates: { id: string; stock: number }[],
  reason: string = "Manual Bulk Update"
) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
    const userId = session.user.id;

    // Use a transaction to ensure all updates and logs are atomic
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        // Get old stock for logging
        const product = await tx.product.findUnique({
          where: { id: update.id },
          select: { stock: true },
        });

        if (!product) continue;

        const oldStock = product.stock;
        const newStock = update.stock;
        const change = newStock - oldStock;

        // Skip if no change
        if (change === 0) continue;

        // Update product stock
        await tx.product.update({
          where: { id: update.id },
          data: { stock: newStock },
        });

        // Create log entry
        await tx.stockLog.create({
          data: {
            productId: update.id,
            userId,
            oldStock,
            newStock,
            change,
            reason,
          },
        });
      }
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin"); // Dashboard low stock alerts

    return { success: true, message: `Successfully updated ${updates.length} products.` };
  } catch (error) {
    logger.error("Bulk Stock Update Error:", error);
    return { success: false, message: "Failed to update stock levels." };
  }
}

/**
 * Fetch stock change history
 */
export async function getStockLogs(limit: number = 50) {
  try {
    await requireRole(["SUPER_ADMIN", "MANAGER"]);

    return await prisma.stockLog.findMany({
      take: limit,
      include: {
        product: {
          select: { name: true, image: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    logger.error("Get Stock Logs Error:", error);
    return [];
  }
}

// --- 12. Shipping & Tax Settings Actions ---

export async function upsertShippingZone(data: { id?: string; name: string; charge: number }) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    
    if (data.id) {
      await prisma.shippingZone.update({
        where: { id: data.id },
        data: {
          name: data.name,
          charge: data.charge,
        },
      });
      
      await createAuditLog({
        adminId: session.user.id,
        action: "UPDATE_SHIPPING_ZONE",
        entityType: "SHIPPING_ZONE",
        entityId: data.id,
        details: `Updated shipping zone "${data.name}" to ${data.charge}`,
      });
    } else {
      const zone = await prisma.shippingZone.create({
        data: {
          name: data.name,
          charge: data.charge,
        },
      });

      await createAuditLog({
        adminId: session.user.id,
        action: "CREATE_SHIPPING_ZONE",
        entityType: "SHIPPING_ZONE",
        entityId: zone.id,
        details: `Created shipping zone "${data.name}" with charge ${data.charge}`,
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    logger.error("Upsert Shipping Zone Error:", error);
    return { success: false, message: "Failed to save shipping zone" };
  }
}

export async function deleteShippingZone(id: string) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    const zone = await prisma.shippingZone.findUnique({ where: { id } });
    
    await prisma.shippingZone.delete({
      where: { id },
    });

    if (zone) {
      await createAuditLog({
        adminId: session.user.id,
        action: "DELETE_SHIPPING_ZONE",
        entityType: "SHIPPING_ZONE",
        entityId: id,
        details: `Deleted shipping zone "${zone.name}"`,
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    logger.error("Delete Shipping Zone Error:", error);
    return { success: false, message: "Failed to delete shipping zone" };
  }
}

export async function updateTaxRate(rate: number) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    
    await prisma.siteSettings.upsert({
      where: { id: "general" },
      update: { taxRate: rate },
      create: { id: "general", taxRate: rate, maintenanceMode: false },
    });

    await createAuditLog({
      adminId: session.user.id,
      action: "UPDATE_TAX_RATE",
      entityType: "SETTINGS",
      entityId: "general",
      details: `Updated global tax rate to ${rate}%`,
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    logger.error("Update Tax Rate Error:", error);
    return { success: false, message: "Failed to update tax rate" };
  }
}
