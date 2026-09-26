"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink,
  Star,
  Clock,
  User,
  Package,
  Search,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateReviewStatus, deleteReview } from "../../reviews/actions";
import { toast } from "sonner";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | Date;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    slug: string;
  };
}

interface ReviewsTableProps {
  initialReviews: ReviewItem[];
  counts?: {
    ALL: number;
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
}

export default function ReviewsTable({ initialReviews }: ReviewsTableProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Live status counts calculated from local state
  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;
  const approvedCount = reviews.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = reviews.filter((r) => r.status === "REJECTED").length;

  const currentCounts = {
    ALL: reviews.length,
    PENDING: pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  };

  // Filtered and searched reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      const matchesFilter = filter === "ALL" || item.status === filter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.user.name.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.product.name.toLowerCase().includes(q) ||
        (item.comment && item.comment.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [reviews, filter, searchQuery]);

  async function handleStatusUpdate(id: string, newStatus: "APPROVED" | "REJECTED") {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    const res = await updateReviewStatus(id, newStatus);
    if (res.success) {
      toast.success(`Review ${newStatus.toLowerCase()}ed successfully`);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update review status");
      setReviews(initialReviews);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    setReviews((prev) => prev.filter((r) => r.id !== id));

    const res = await deleteReview(id);
    if (res.success) {
      toast.success("Review deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete review");
      setReviews(initialReviews);
    }
  }

  const TABS = [
    { key: "ALL" as const, label: "All Reviews", count: currentCounts.ALL },
    { key: "PENDING" as const, label: "Pending", count: currentCounts.PENDING },
    { key: "APPROVED" as const, label: "Approved", count: currentCounts.APPROVED },
    { key: "REJECTED" as const, label: "Rejected", count: currentCounts.REJECTED },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isActive
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user, product, comment..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Actionable Reviews Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User & Product</th>
                <th className="px-5 py-3.5">Rating & Review</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* User & Product */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          <span>{review.user.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {review.user.email}
                        </div>
                        <Link 
                          href={`/products/${review.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
                        >
                          <Package size={12} />
                          <span className="truncate max-w-[200px]">{review.product.name}</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </td>

                    {/* Rating & Review */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={cn(
                                s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"
                              )}
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {review.comment || <span className="italic text-gray-400">No written comment provided.</span>}
                        </p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {review.images.map((img, i) => (
                              <div key={i} className="relative w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                                <NextImage src={img} alt="review attachment" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          review.status === "PENDING" &&
                            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
                          review.status === "APPROVED" &&
                            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
                          review.status === "REJECTED" &&
                            "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                        )}
                      >
                        {review.status === "PENDING" && <Clock size={11} />}
                        {review.status === "APPROVED" && <CheckCircle2 size={11} />}
                        {review.status === "REJECTED" && <XCircle size={11} />}
                        <span>{review.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {review.status !== "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(review.id, "APPROVED")}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Approve Review"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                        )}
                        {review.status !== "REJECTED" && (
                          <button
                            onClick={() => handleStatusUpdate(review.id, "REJECTED")}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Reject Review"
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No reviews found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Customer product reviews and ratings will appear here for moderation.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
