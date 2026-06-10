"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FieldErrors, useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Info,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Layers,
  Loader2,
  Zap,
  Plus,
  Cpu,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/modules/products/components/product-card";
import { createProduct, getCategoriesOptions } from "@/modules/admin/actions";
import { generateSlug, cn } from "@/lib/utils";
import ImageUpload from "@/components/ui/image-upload";
import CategoryModal from "@/modules/admin/components/category-modal";

// --- Validation Schema ---
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description needs more detail"),
  price: z.coerce.number().min(0.1, "Price must be greater than 0"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Please select a category"),
  colors: z.array(z.string()).default([]),
  switchType: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  dpi: z.string().optional(),
  weight: z.string().optional(),
  connectionType: z.string().optional(),
  pollingRate: z.string().optional(),
  sensor: z.string().optional(),
  warranty: z.string().optional(),
  availability: z.string().optional(),
  isActive: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable(),
  specs: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).nullable()).optional(),
});

interface FormValues {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  categoryId: string;
  colors: string[];
  switchType?: string;
  brand?: string;
  sku?: string;
  dpi?: string;
  weight?: string;
  connectionType?: string;
  pollingRate?: string;
  sensor?: string;
  warranty?: string;
  availability?: string;
  isActive: boolean;
  scheduledAt?: string | null;
  specs?: Record<string, string | number | boolean | null>;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 10,
      image: "",
      categoryId: "",
      colors: [],
      switchType: "",
      brand: "",
      sku: "",
      dpi: "",
      weight: "",
      connectionType: "",
      pollingRate: "",
      sensor: "",
      warranty: "",
      availability: "In Stock",
      isActive: true,
      scheduledAt: "",
      specs: {},
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  // Fetch Categories
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getCategoriesOptions();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Slug Logic
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name, { shouldValidate: true });
    const slug = generateSlug(name);
    form.setValue("slug", slug, { shouldValidate: true, shouldDirty: true });
  };

  // Submit Handler
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsPending(true);
    try {
      const res = await createProduct(data);
      if (res.success) {
        toast.success("Product added successfully! Ready for next one.");

        form.reset({
          name: "",
          slug: "",
          description: "",
          price: 0,
          stock: 10,
          image: "",
          categoryId: data.categoryId,
          colors: [],
          switchType: "",
          brand: "",
          sku: "",
          dpi: "",
          weight: "",
          connectionType: "",
          pollingRate: "",
          sensor: "",
          warranty: "",
          availability: "In Stock",
          isActive: true,
          scheduledAt: "",
          specs: {},
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (res.message.toLowerCase().includes("slug")) {
          form.setError("slug", { type: "manual", message: res.message });
          toast.error(res.message);
        } else {
          toast.error(res.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    console.log("Validation Errors:", errors);
    if (errors.categoryId) {
      toast.error("Don't forget to select a category!");
    } else {
      toast.error("Please check the form for errors.");
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-800/50/50 pb-24 md:pb-32">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="pt-8 pb-6 px-6 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Product
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new product for your store inventory.
              </p>
            </div>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm dark:shadow-none",
                showPreview 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="text-sm font-medium">
                {showPreview ? "Hide Preview" : "Show Preview"}
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-6 grid grid-cols-1 lg:grid-cols-1 gap-8 relative overflow-hidden max-w-[1600px] mx-auto w-full">
          {/* --- LEFT SIDE: FORM --- */}
          <div className={cn(
            "space-y-8 transition-all duration-500",
            showPreview ? "lg:mr-[400px]" : "mr-0"
          )}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              {/* General Info */}
              <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Info size={20} className="text-indigo-600" /> General
                  Information
                </h2>
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("name")}
                      onChange={handleNameChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Wireless Noise Cancelling Headphones"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      Slug (URL) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                          /products/
                        </span>
                        <input
                          {...form.register("slug")}
                          className={`w-full pl-24 pr-10 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 outline-none font-mono text-sm text-indigo-600 transition-all ${
                            form.formState.errors.slug
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-indigo-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentName = form.getValues("name");
                            if (currentName) {
                              const slug = generateSlug(currentName);
                              form.setValue("slug", slug, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              toast.info("Slug regenerated from name");
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Regenerate from Name"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>

                      {/* ✅ Change 3: External Link Icon */}
                      {watchedValues.slug && (
                        <Link
                          href={`/products/${watchedValues.slug}`}
                          target="_blank"
                          className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-indigo-600 transition-colors"
                          title="Preview URL in new tab"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      )}
                    </div>

                    {form.formState.errors.slug && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
                        <AlertCircle size={12} />
                        <span>{form.formState.errors.slug.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Layers
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <select
                          {...form.register("categoryId")}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 outline-none appearance-none transition-all cursor-pointer ${
                            form.formState.errors.categoryId
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-indigo-500"
                          }`}
                        >
                          <option value="">Select a category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {isLoadingCategories && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2
                              className="animate-spin text-indigo-600"
                              size={16}
                            />
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        <CategoryModal />
                      </div>

                      <button
                        type="button"
                        onClick={fetchCategories}
                        className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh Categories"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    {form.formState.errors.categoryId && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      {...form.register("description")}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none resize-none"
                      placeholder="Detailed description of the product..."
                    />
                    {form.formState.errors.description && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Specifications & Variants */}
              <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Zap size={80} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Zap size={20} className="text-indigo-600" /> Technical Specifications
                </h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Switch Type */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-indigo-600 uppercase tracking-widest text-[10px] block">
                        Keyboard Switch Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Linear", "Tactile", "Clicky", "Optical"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => form.setValue("switchType", type, { shouldDirty: true })}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2",
                              watchedValues.switchType === type
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg dark:shadow-none shadow-indigo-200"
                                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-200"
                            )}
                          >
                            {watchedValues.switchType === type && <Zap size={14} fill="currentColor" />}
                            {type}
                          </button>
                        ))}
                      </div>
                      <input 
                        {...form.register("switchType")}
                        placeholder="Other switch type..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                      />
                    </div>

                    {/* Colors */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-indigo-600 uppercase tracking-widest text-[10px] block">
                        Available Colors
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {watchedValues.colors?.map((color, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg group animate-in fade-in zoom-in duration-200"
                          >
                            <div 
                               className="w-3 h-3 rounded-full border border-gray-300"
                               style={{ backgroundColor: color.toLowerCase() }}
                            />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{color}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = [...(watchedValues.colors || [])];
                                newColors.splice(index, 1);
                                form.setValue("colors", newColors, { shouldDirty: true });
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(!watchedValues.colors || watchedValues.colors.length === 0) && (
                          <p className="text-xs text-gray-400 italic">No colors added yet.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          id="color-input"
                          placeholder="Add color (e.g. Red, #FF0000)"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (value) {
                                const currentColors = watchedValues.colors || [];
                                if (!currentColors.includes(value)) {
                                  form.setValue("colors", [...currentColors, value], { shouldDirty: true });
                                }
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("color-input") as HTMLInputElement;
                            const value = input.value.trim();
                            if (value) {
                              const currentColors = watchedValues.colors || [];
                              if (!currentColors.includes(value)) {
                                form.setValue("colors", [...currentColors, value], { shouldDirty: true });
                              }
                              input.value = "";
                            }
                          }}
                          className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-indigo-600 transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Matrix Specifications Editor */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter block">
                          Technical Index Matrix
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Add parameters used in the comparison matrix.</p>
                      </div>
                      <Link 
                        href="/admin/products/compare-preview"
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Preview Matrix <ExternalLink size={10} />
                      </Link>
                    </div>

                    {/* Active Specs List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(watchedValues.specs || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 group">
                           <div className="flex-1 min-w-0">
                             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">{key}</div>
                             <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{value as string}</div>
                           </div>
                           <button
                             type="button"
                             onClick={() => {
                               const currentSpecs = { ...(watchedValues.specs || {}) };
                               delete currentSpecs[key];
                               form.setValue("specs", currentSpecs, { shouldDirty: true });
                             }}
                             className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                           >
                              <X size={16} />
                           </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Spec Row */}
                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                       <input 
                        id="spec-key"
                        placeholder="Key (e.g. Brand)"
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-indigo-500"
                       />
                       <input 
                        id="spec-value"
                        placeholder="Value (e.g. Logitech)"
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const keyInput = document.getElementById("spec-key") as HTMLInputElement;
                            const valueInput = document.getElementById("spec-value") as HTMLInputElement;
                            const k = keyInput.value.trim();
                            const v = valueInput.value.trim();
                            if (k && v) {
                              const currentSpecs = { ...(watchedValues.specs || {}) };
                              currentSpecs[k] = v;
                              form.setValue("specs", currentSpecs, { shouldDirty: true });
                              keyInput.value = "";
                              valueInput.value = "";
                              keyInput.focus();
                            }
                          }
                        }}
                       />
                       <button
                         type="button"
                         onClick={() => {
                            const keyInput = document.getElementById("spec-key") as HTMLInputElement;
                            const valueInput = document.getElementById("spec-value") as HTMLInputElement;
                            const k = keyInput.value.trim();
                            const v = valueInput.value.trim();
                            if (k && v) {
                              const currentSpecs = { ...(watchedValues.specs || {}) };
                              currentSpecs[k] = v;
                              form.setValue("specs", currentSpecs, { shouldDirty: true });
                              keyInput.value = "";
                              valueInput.value = "";
                              keyInput.focus();
                            }
                         }}
                         className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                       >
                         <Plus size={16} /> Add
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Technical Specs */}
              <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Cpu size={20} className="text-indigo-600" /> Advanced Technical Index
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Brand */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                    <input 
                      {...form.register("brand")}
                      placeholder="e.g. Logitech, Razer"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">SKU / Model</label>
                    <input 
                      {...form.register("sku")}
                      placeholder="e.g. G-PRO-WL-01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* Availability */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Availability Status</label>
                    <select
                      {...form.register("availability")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Pre-Order">Pre-Order</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>

                  {/* Sensor */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sensor Technology</label>
                    <input 
                      {...form.register("sensor")}
                      placeholder="e.g. HERO 25K, Focus Pro"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* DPI */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Max DPI / Sensitivity</label>
                    <input 
                      {...form.register("dpi")}
                      placeholder="e.g. 25,600 DPI"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Weight</label>
                    <input 
                      {...form.register("weight")}
                      placeholder="e.g. 63g (Ultra-light)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* Connection */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Connection Type</label>
                    <input 
                      {...form.register("connectionType")}
                      placeholder="e.g. LIGHTSPEED, Bluetooth"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* Polling Rate */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Polling Rate</label>
                    <input 
                      {...form.register("pollingRate")}
                      placeholder="e.g. 1000Hz, 8000Hz"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>

                  {/* Warranty */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Warranty Period</label>
                    <input 
                      {...form.register("warranty")}
                      placeholder="e.g. 2 Year Limited"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Media</h2>
                <div className="space-y-4">
                  <ImageUpload
                    value={watchedValues.image ? [watchedValues.image] : []}
                    disabled={isPending}
                    onChange={(url) =>
                      form.setValue("image", url, { shouldValidate: true })
                    }
                    onRemove={() =>
                      form.setValue("image", "", { shouldValidate: true })
                    }
                  />
                  {form.formState.errors.image && (
                    <p className="text-red-500 text-xs mt-2">
                      {form.formState.errors.image.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Pricing
                  </h2>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...form.register("price")}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none font-bold text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-xs mt-2">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Inventory
                  </h2>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      {...form.register("stock")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none"
                      placeholder="0"
                    />
                    {form.formState.errors.stock && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Schedule */}
              <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <RefreshCw size={20} className="text-indigo-600" /> Status & Scheduling
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      Product Status
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => form.setValue("isActive", !watchedValues.isActive)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                          watchedValues.isActive ? "bg-indigo-600" : "bg-gray-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition duration-200 ease-in-out",
                            watchedValues.isActive ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {watchedValues.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Inactive products won&apos;t be visible to customers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      Scheduled Launch (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      {...form.register("scheduledAt")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 focus:border-indigo-500 outline-none text-sm font-bold"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Product will go live automatically at this time.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* --- RIGHT SIDE: PREVIEW (Side Panel) --- */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6 space-y-6 pb-32">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">Live Preview</h3>
                      <p className="text-indigo-600 text-xs font-medium">
                        Real-time customer view
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="bg-linear-to-br from-indigo-900 to-indigo-800 rounded-2xl p-4 text-white shadow-lg dark:shadow-none">
                    <p className="text-indigo-100 text-xs font-medium">
                      This is how customers will see your product on the storefront.
                    </p>
                  </div>

                  <div className="ring-8 ring-gray-50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800">
                    <ProductCard
                        data={{
                          id: "preview",
                          name: watchedValues.name || "Product Name",
                          price: Number(watchedValues.price) || 0,
                          image: watchedValues.image || null,
                          description: watchedValues.description || null,
                          stock: Number(watchedValues.stock),
                          slug: watchedValues.slug || "slug",
                          colors: watchedValues.colors || [],
                          switchType: watchedValues.switchType || null,
                          isActive: watchedValues.isActive ?? true,
                          scheduledAt: watchedValues.scheduledAt ? new Date(watchedValues.scheduledAt) : null,
                          specs: (watchedValues.specs || {}) as Record<string, string | number | boolean | null>,
                          brand: watchedValues.brand || null,
                          sku: watchedValues.sku || null,
                          dpi: watchedValues.dpi || null,
                          weight: watchedValues.weight || null,
                          connectionType: watchedValues.connectionType || null,
                          pollingRate: watchedValues.pollingRate || null,
                          sensor: watchedValues.sensor || null,
                          warranty: watchedValues.warranty || null,
                          availability: watchedValues.availability || null,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          categoryId: watchedValues.categoryId || null,
                          // Matching category name
                          category: {
                            id: watchedValues.categoryId || "temp",
                            name:
                              categories.find(
                                (c) => c.id === watchedValues.categoryId
                              )?.name || "Uncategorized",
                            slug: "temp",
                            description: null,
                            image: null,
                            parentId: null,
                            isActive: true,
                            isFeatured: false,
                            seoTitle: null,
                            seoDescription: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          },
                        }}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm space-y-4 shadow-sm dark:shadow-none">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       <Zap size={16} className="text-indigo-600" />
                       Quick Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700/50">
                        <span className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Status</span>
                        <span className={cn(
                          "font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          watchedValues.isActive 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                            : "text-amber-700 bg-amber-50 border-amber-100"
                        )}>
                          {watchedValues.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700/50">
                        <span className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Category</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {categories.find((c) => c.id === watchedValues.categoryId)
                            ?.name || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Price</span>
                        <span className="font-black text-indigo-600 text-base">
                          ${watchedValues.price?.toString() || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 z-40 transition-all duration-500",
        showPreview && "lg:right-[400px]"
      )}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between lg:pl-72">
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {form.formState.isDirty
              ? "You have unsaved changes."
              : "Ready to save."}
            
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                showPreview 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm dark:shadow-none" 
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-xs font-bold uppercase tracking-wider">Preview</span>
            </button>
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors shadow-sm dark:shadow-none"
            >
              Cancel
            </button>
            <button
              onClick={form.handleSubmit(onSubmit, onInvalid)}
              disabled={isPending}
              className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg dark:shadow-none shadow-indigo-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
