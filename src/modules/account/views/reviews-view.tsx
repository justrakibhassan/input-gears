"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewWithProduct {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    price: number;
  };
}

interface AccountReviewsViewProps {
  reviews: ReviewWithProduct[];
}

export default function AccountReviewsView({ reviews }: AccountReviewsViewProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");

  const filteredReviews = useMemo(() => {
    if (activeTab === "ALL") return reviews;
    return reviews.filter((review) => review.status === activeTab);
  }, [reviews, activeTab]);

  const counts = useMemo(() => {
    return {
      ALL: reviews.length,
      APPROVED: reviews.filter((r) => r.status === "APPROVED").length,
      PENDING: reviews.filter((r) => r.status === "PENDING").length,
      REJECTED: reviews.filter((r) => r.status === "REJECTED").length,
    };
  }, [reviews]);

  const tabs = [
    { id: "ALL", label: "All Reviews" },
    { id: "APPROVED", label: "Approved" },
    { id: "PENDING", label: "Pending" },
    { id: "REJECTED", label: "Rejected" },
  ] as const;

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-150 mb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Star size={20} className="fill-current" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              My <span className="text-indigo-600">Reviews</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-lg">
            View the reviews you have written and track their moderation status.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-xs self-start md:self-auto shrink-0">
            <span className="text-xs font-black text-gray-900">
              {reviews.length}
            </span>
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">
              Total Reviews
            </span>
          </div>
        )}
      </div>

      {/* Tabs Filter */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0",
                    isActive
                      ? "bg-indigo-800 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="max-w-xl mx-auto text-center py-16 px-6 flex flex-col items-center">
          <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
            <Star size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 uppercase">
            {reviews.length === 0 ? "You haven't reviewed any items yet" : "No reviews found"}
          </h2>
          <p className="text-sm text-gray-500 mb-8 font-medium max-w-sm">
            {reviews.length === 0
              ? "Share your experiences with other shoppers by reviewing products from your orders!"
              : `You do not have any reviews matching the "${activeTab.toLowerCase()}" filter status.`}
          </p>
          <Link
            href={reviews.length === 0 ? "/account/orders" : "/products"}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-gray-200 hover:shadow-indigo-100 group text-sm"
          >
            <ShoppingBag size={18} />
            {reviews.length === 0 ? "View My Orders" : "Start Shopping"}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((review) => {
            const product = review.product;
            const reviewDate = new Date(review.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={review.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col gap-5 transition-all hover:shadow-md hover:border-gray-200"
              >
                {/* Product & Status Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <Package size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-sm sm:text-base leading-snug line-clamp-1 max-w-[280px] sm:max-w-md"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase">
                        Price: ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
                    {review.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 bg-[#D1FAE5] text-[#065F46] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#A7F3D0]">
                        <CheckCircle2 size={11} /> Approved
                      </span>
                    )}
                    {review.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#FDE68A]">
                        <Clock size={11} /> Pending Approval
                      </span>
                    )}
                    {review.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-150">
                        <AlertTriangle size={11} /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={cn(
                          "transition-all duration-200",
                          star <= review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    {reviewDate}
                  </span>
                </div>

                {/* Comment Text */}
                {review.comment ? (
                  <div className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-50 italic leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    No details provided.
                  </div>
                )}

                {/* Optional Uploaded Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {review.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 hover:scale-105 transition-transform duration-200 shrink-0 shadow-xs"
                      >
                        <Image
                          src={img}
                          alt={`Review attachment ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
