"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink,
  Star,
  Clock,
  User,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminGetReviews, updateReviewStatus, deleteReview } from "../../reviews/actions";
import { toast } from "sonner";
import NextImage from "next/image";
import Link from "next/link";
import { useCallback } from "react";

interface Review {
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

export default function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("ALL");

  const loadReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await adminGetReviews(filter === "ALL" ? undefined : filter);
      if (res.success) {
        setReviews(res.data as Review[]);
      } else {
        toast.error(res.error || "Failed to load reviews");
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isMounted = true;
    
    const fetch = async () => {
      // Don't set loading(true) here if it's already true from initial state
      // to avoid cascading render warning
      const res = await adminGetReviews(filter === "ALL" ? undefined : filter);
      if (isMounted) {
        if (res.success) {
          setReviews(res.data as Review[]);
        } else {
          toast.error(res.error || "Failed to load reviews");
        }
        setLoading(false);
      }
    };

    fetch();
    return () => { isMounted = false; };
  }, [filter]);

  async function handleStatusUpdate(id: string, status: "APPROVED" | "REJECTED") {
    const res = await updateReviewStatus(id, status);
    if (res.success) {
      toast.success(`Review ${status.toLowerCase()}ed`);
      loadReviews(false); // Don't show full spinner for updates
    } else {
      toast.error(res.error || "Failed to update review");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const res = await deleteReview(id);
    if (res.success) {
      toast.success("Review deleted");
      loadReviews(false);
    } else {
      toast.error(res.error || "Failed to delete review");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-max">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              filter === f 
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm dark:shadow-none" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm dark:shadow-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50/50 border-b border-gray-100 dark:border-gray-800">
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User / Product</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating & Comment</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="p-8 bg-gray-50 dark:bg-gray-800/50/20" />
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400 italic font-medium">
                  No reviews found.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="group hover:bg-gray-50 dark:bg-gray-800/50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                        <User size={14} className="text-gray-400" /> {review.user.name}
                      </div>
                      <Link 
                        href={`/products/${review.product.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:underline"
                      >
                        <Package size={14} /> {review.product.name} <ExternalLink size={10} />
                      </Link>
                    </div>
                  </td>
                  <td className="py-4 px-6 max-w-md">
                    <div className="space-y-2">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12} className={cn("fill-current", s <= review.rating ? "text-yellow-400" : "text-gray-200")} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{review.comment || <span className="italic">No comment</span>}</p>
                      {review.images.length > 0 && (
                        <div className="flex gap-1">
                          {review.images.map((img: string, i: number) => (
                            <div key={i} className="relative w-8 h-8 rounded border border-gray-100 dark:border-gray-800 overflow-hidden">
                              <NextImage src={img} alt="review" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      review.status === "APPROVED" && "bg-green-50 text-green-600",
                      review.status === "PENDING" && "bg-amber-50 text-amber-600",
                      review.status === "REJECTED" && "bg-red-50 text-red-600"
                    )}>
                      {review.status === "PENDING" && <Clock size={10} />}
                      {review.status === "APPROVED" && <CheckCircle2 size={10} />}
                      {review.status === "REJECTED" && <XCircle size={10} />}
                      {review.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                       {review.status !== "APPROVED" && (
                         <button 
                          onClick={() => handleStatusUpdate(review.id, "APPROVED")}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                         >
                           <CheckCircle2 size={18} />
                         </button>
                       )}
                       {review.status !== "REJECTED" && (
                         <button 
                          onClick={() => handleStatusUpdate(review.id, "REJECTED")}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reject"
                         >
                           <XCircle size={18} />
                         </button>
                       )}
                       <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
