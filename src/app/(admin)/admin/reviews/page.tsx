import { prisma } from "@/lib/prisma";
import ReviewsTable, { ReviewItem } from "@/modules/admin/components/reviews-table";
import { Star } from "lucide-react";

export const metadata = {
  title: "Review Moderation — Admin",
};

export default async function AdminReviewsPage() {
  const [
    reviews,
    allCount,
    pendingCount,
    approvedCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.review.findMany({
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
    }),
    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.count({ where: { status: "REJECTED" } }),
  ]);

  const counts = {
    ALL: allCount,
    PENDING: pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Page Header with Title on Left & Summary Badges on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Star size={20} className="fill-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Review Moderation
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Review, approve, or reject customer product ratings and feedback
            </p>
          </div>
        </div>

        {/* Right Side: Total Reviews, Pending, Approved Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 font-medium">Total Reviews:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {allCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Pending:
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {pendingCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl shadow-2xs text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Approved:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {approvedCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Actionable Reviews Table & Filter Bar */}
      <ReviewsTable
        initialReviews={reviews as unknown as ReviewItem[]}
        counts={counts}
      />
    </div>
  );
}
