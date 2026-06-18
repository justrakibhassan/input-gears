"use client";

import { useQueryState, useQueryStates, parseAsString, parseAsFloat } from "nuqs";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ProductFiltersProps {
  categories: { id: string; name: string }[];
  brands: string[];
}

export default function ProductFilters({ categories, brands }: ProductFiltersProps) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ shallow: false, throttleMs: 500 }));
  const [category, setCategory] = useQueryState("category", parseAsString.withDefault("").withOptions({ shallow: false }));
  const [brand, setBrand] = useQueryState("brand", parseAsString.withDefault("").withOptions({ shallow: false }));
  
  const [priceQuery, setPriceQuery] = useQueryStates(
    {
      minPrice: parseAsFloat,
      maxPrice: parseAsFloat,
    },
    {
      shallow: false,
      throttleMs: 300,
    }
  );
  
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("newest").withOptions({ shallow: false }));

  const minPrice = priceQuery.minPrice;
  const maxPrice = priceQuery.maxPrice;

  // Local state for price slider to keep slider handle movements buttery smooth
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice ?? 0, maxPrice ?? 2000]);

  // Sync local state when url query params change (e.g. on reset or direct navigation)
  useEffect(() => {
    setPriceRange([minPrice ?? 0, maxPrice ?? 2000]);
  }, [minPrice, maxPrice]);

  const activeFiltersCount = [category, brand, minPrice, maxPrice, sort !== "newest" ? sort : null].filter(Boolean).length;

  const handleReset = () => {
    setQ("");
    setCategory("");
    setBrand("");
    setPriceQuery({ minPrice: null, maxPrice: null });
    setSort("newest");
    setPriceRange([0, 2000]);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
    setPriceQuery({ minPrice: value[0], maxPrice: value[1] });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-950" />
          <h3 className="text-sm font-bold text-gray-950">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-950 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2 text-xs font-semibold text-gray-400 hover:text-gray-950 transition-colors gap-2"
        >
          <RotateCcw size={12} />
          Reset
        </Button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-950 transition-colors" />
        <Input
          placeholder="Search devices..."
          value={q ?? ""}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10 h-10 bg-gray-50/50 border-gray-200 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-950 focus-visible:border-gray-950 transition-all"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-md transition-all"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Price Range (directly below search) */}
      <div className="space-y-4 pt-2 pb-4 border-b">
        <h4 className="text-xs font-bold text-gray-700">Price range</h4>
        <div className="space-y-5 px-1">
          <Slider
            value={priceRange}
            max={2000}
            step={50}
            onValueChange={handlePriceChange}
            className="[&_.relative]:h-1.5 **:data-[slot=slider-range]:bg-gray-950 **:data-[slot=slider-thumb]:bg-white **:data-[slot=slider-thumb]:border-gray-950"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center bg-gray-50 border border-gray-100 rounded-xl py-2">
              <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Min price</span>
              <span className="text-xs font-black text-gray-950">${priceRange[0]}</span>
            </div>
            <div className="flex-1 text-center bg-gray-50 border border-gray-100 rounded-xl py-2">
              <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Max price</span>
              <span className="text-xs font-black text-gray-950">${priceRange[1]}+</span>
            </div>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["categories", "brands"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories" className="border-b-0 py-2">
          <AccordionTrigger className="hover:no-underline py-2 text-xs font-bold text-gray-700">
            Categories
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(category === cat.name ? "" : cat.name)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    category === cat.name
                      ? "bg-gray-900 border-gray-900 text-white shadow-md"
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-900 hover:text-gray-900"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brands */}
        <AccordionItem value="brands" className="border-b-0 py-2">
          <AccordionTrigger className="hover:no-underline py-2 text-xs font-bold text-gray-700">
            Featured brands
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="grid grid-cols-1 gap-1">
              {brands.map((b) => (
                <div key={b} className="flex items-center space-x-2 rounded-xl hover:bg-gray-50 p-2 border border-transparent transition-all">
                  <Checkbox 
                    id={`brand-${b}`} 
                    checked={brand === b}
                    onCheckedChange={() => setBrand(brand === b ? "" : b)}
                    className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                  />
                  <Label 
                    htmlFor={`brand-${b}`} 
                    className={cn(
                      "text-sm font-bold cursor-pointer transition-colors flex-1",
                      brand === b ? "text-gray-950" : "text-gray-500"
                    )}
                  >
                    {b}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sorting */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-xs font-bold text-gray-700">Sort inventory</h4>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "newest", label: "Newest Arrivals" },
            { id: "price_asc", label: "Price: Low to High" },
            { id: "price_desc", label: "Price: High to Low" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSort(option.id)}
              className={cn(
                "group flex items-center justify-between w-full p-3.5 rounded-xl border text-xs font-bold transition-all",
                sort === option.id
                  ? "bg-gray-950 border-gray-950 text-white shadow-xl shadow-gray-200"
                  : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-950"
              )}
            >
              {option.label}
              <div className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                sort === option.id ? "bg-white scale-125" : "bg-gray-200 group-hover:bg-gray-400"
              )} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

