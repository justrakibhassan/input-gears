"use client";

import { useState } from "react";
import { Star, Send, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitReview } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { useSession } from "@/lib/auth-client";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const router = useRouter();

  const userRole = (session?.user as { role?: string })?.role;
  const isStoreStaff = userRole && ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(userRole);

  if (isStoreStaff) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-xs">
        <Star className="text-indigo-600/30 mb-3" size={40} />
        <h3 className="text-sm font-bold text-gray-900">Admin Account</h3>
        <p className="text-xs text-gray-500 mt-1 text-center max-w-sm">
          Store administrators and managers cannot submit product reviews.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const result = await submitReview({
      productId,
      rating,
      comment,
      images,
    });

    if (result.success) {
      toast.success("Review submitted! It will appear after admin approval.");
      setComment("");
      setImages([]);
      setRating(5);
      setIsFormOpen(false);
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit review");
    }
    setIsSubmitting(false);
  }

  if (!isFormOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
        <Star className="text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-900">Share your experience</h3>
        <p className="text-gray-500 mt-1 mb-6">Have you used this product? Help others with your review!</p>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
        >
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900">Submit Your Review</h3>
        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-900">
          <X size={24} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">How would you rate it?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="transition-transform active:scale-90"
            >
              <Star
                size={32}
                className={cn(
                  "transition-all duration-200",
                  (hoverRating || rating) >= s ? "text-yellow-400 fill-current" : "text-gray-200"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Details (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? How's the performance?"
          className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-700 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Photos (Optional)</label>
        <div className="flex flex-wrap gap-4">
          {/* Placeholder for Photo Upload Integration */}
          {images.map((img, idx) => (
             <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                <NextImage src={img} alt="Preview" fill className="object-cover" />
             </div>
          ))}
          <button 
            type="button"
            className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition"
            onClick={() => {
              // Note: In a real app, integrate with an upload provider like Cloudinary
              const url = prompt("Enter an image URL for the review (Simulation of upload):");
              if (url) setImages([...images, url]);
            }}
          >
            <Camera size={24} />
            <span className="text-[10px] font-bold mt-1">ADD</span>
          </button>
        </div>
      </div>

      <button
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
      >
        {isSubmitting ? "Submitting..." : (
          <>
            <Send size={18} /> Publish Review
          </>
        )}
      </button>
    </div>
  );
}
