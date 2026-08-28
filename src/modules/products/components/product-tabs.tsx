"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Product } from "../types";
import { FileText, ClipboardList, MessageSquare, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReviewList from "../../reviews/components/review-list";
import ReviewForm from "../../reviews/components/review-form";
import { getReviewStats } from "../../reviews/actions";

interface ProductTabsProps {
  product: Product;
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState("specification");
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const res = await getReviewStats(product.id);
      if (res.success && res.data) {
        setReviewCount(res.data.totalReviews);
      }
    }
    loadStats();
  }, [product.id]);

  const tabs = [
    { id: "specification", label: "Specification", icon: ClipboardList },
    { id: "description", label: "Description", icon: FileText },
    { id: "questions", label: "Questions (0)", icon: MessageSquare },
    { id: "reviews", label: `Reviews (${reviewCount})`, icon: Star },
  ];

  const specs = useMemo(() => {
    const map = new Map<string, string | number>();

    const addSpec = (label: string, value: string | number | null | undefined) => {
      if (value !== null && value !== undefined && value !== "") {
        map.set(label.trim(), value);
      }
    };

    addSpec("Brand", product.brand);
    addSpec("SKU / Model Code", product.sku);
    addSpec("Switch Type", product.switchType);
    addSpec("Connection Type", product.connectionType);
    addSpec("Sensor", product.sensor);
    addSpec("DPI / Resolution", product.dpi);
    addSpec("Polling Rate", product.pollingRate);
    addSpec("Weight", product.weight);
    addSpec("Warranty", product.warranty);
    addSpec("Availability", product.availability);

    // Include custom JSON specs if provided, safely excluding colorMap or nested objects
    if (product.specs && typeof product.specs === "object") {
      Object.entries(product.specs).forEach(([key, val]) => {
        if (key === "colorMap") return;
        if (typeof val === "object" && val !== null) return;
        if (val !== null && val !== undefined && val !== "") {
          const formattedLabel = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
          if (!map.has(formattedLabel)) {
            map.set(formattedLabel, String(val));
          }
        }
      });
    }

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [product]);

  return (
    <div className="w-full">
      {/* Tabs Header Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-8 pb-px overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer",
                isActive
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <Icon size={18} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeProductTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-2px_8px_rgba(79,70,229,0.4)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs Content Surface */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. Specification Tab */}
            {activeTab === "specification" && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {specs.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {specs.map((spec, index) => (
                        <tr
                          key={`${spec.label}-${index}`}
                          className={cn(
                            "transition-colors hover:bg-gray-50/50",
                            index !== specs.length - 1 && "border-b border-gray-50",
                          )}
                        >
                          <td className="py-4 px-6 text-sm font-medium text-gray-500 w-1/3">
                            {spec.label}
                          </td>
                          <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm font-medium">
                    No detailed specifications listed for this product yet.
                  </div>
                )}
              </div>
            )}

            {/* 2. Description Tab */}
            {activeTab === "description" && (
              <div className="prose prose-indigo max-w-none bg-white p-8 rounded-2xl border border-gray-100 shadow-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {product.description || "No description available."}
              </div>
            )}

            {/* 3. Questions Tab */}
            {activeTab === "questions" && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <MessageSquare className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No questions yet</h3>
                <p className="text-gray-500 mt-2 max-w-xs">
                  Be the first to ask a question about this product!
                </p>
                <button className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition shadow-lg cursor-pointer">
                  Ask a Question
                </button>
              </div>
            )}

            {/* 4. Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-12">
                <ReviewForm productId={product.id} />
                <ReviewList productId={product.id} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductTabs;
