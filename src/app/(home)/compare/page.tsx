import { Suspense } from "react";
import CompareView from "@/modules/products/views/compare-view";

export const metadata = {
  title: "Compare Products | INPUTGEARS",
  description: "Compare your favorite gadgets and gear side by side.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading Comparison...</div>}>
      <CompareView />
    </Suspense>
  );
}
