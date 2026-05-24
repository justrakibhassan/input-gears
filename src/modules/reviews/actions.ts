"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).default([]),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function submitReview(data: z.infer<typeof reviewSchema>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("You must be logged in to submit a review");
    }

    const { productId, rating, comment, images } = reviewSchema.parse(data);

    // Check if user already reviewed this product to prevent spam (optional)
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment,
        images,
        status: "PENDING", // Require moderation
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true, data: review };
  } catch (error) {
    logger.error("Failed to submit review", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit review",
    };
  }
}

export async function getProductReviews(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: reviews };
  } catch (error) {
    logger.error("Failed to fetch reviews", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

export async function getReviewStats(productId: string) {
  try {
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: "APPROVED",
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      success: true,
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
      },
    };
  } catch (error) {
    logger.error("Get Review Stats Error", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

// --- Admin Actions ---

export async function adminGetReviews(
  status?: "PENDING" | "APPROVED" | "REJECTED",
) {
  try {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: reviews };
  } catch (error) {
    logger.error("Admin Get Reviews Error", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

export async function updateReviewStatus(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
) {
  try {
    await requireAdmin();

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${review.productId}`);
    return { success: true, data: review };
  } catch (error) {
    logger.error("Update Review Status Error", error);
    return { success: false, error: "Failed to update review status" };
  }
}

export async function deleteReview(reviewId: string) {
  try {
    await requireAdmin();

    const review = await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${review.productId}`);
    return { success: true };
  } catch (error) {
    logger.error("Delete Review Error", error);
    return { success: false, error: "Failed to delete review" };
  }
}
