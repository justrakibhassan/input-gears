import ReviewsTable from "@/modules/admin/components/reviews-table";
import { MessageSquare } from "lucide-react";

export default function AdminReviewsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
            Review Moderation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Approve or reject customer reviews to build trust.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center gap-4 group hover:border-indigo-100 transition-all">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
          <MessageSquare size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
            Community Trust
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Social Proof & Ratings
          </h3>
        </div>
      </div>

      <ReviewsTable />
    </div>
  );
}
