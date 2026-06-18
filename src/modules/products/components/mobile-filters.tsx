"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ProductFilters from "./product-filters";

interface MobileFiltersProps {
  categories: { id: string; name: string }[];
  brands: string[];
}

export default function MobileFilters({
  categories,
  brands,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-24 right-6 z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            aria-label="Open filters"
            className="h-14 w-14 rounded-full bg-gray-950 text-white shadow-2xl shadow-gray-400 border-none hover:bg-gray-800 active:scale-95 transition-all"
          >
            <Filter size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[85%] sm:w-[400px] p-0 border-none bg-white"
        >
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold text-gray-950">
                  Filter <span className="text-gray-500">inventory</span>
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 pb-24">
              <ProductFilters categories={categories} brands={brands} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
