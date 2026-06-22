"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Zap,
  Cpu,
  Plus,
  X,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/modules/products/components/product-card";
import { updateProduct, getCategoriesOptions } from "@/modules/admin/actions";
import { Product } from "@/types/product";
import ImageUpload from "@/components/ui/image-upload";
import CategoryModal from "@/modules/admin/components/category-modal";
import { generateSlug } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

const formSchema = z.object({
  name: z.string().min(3, "Name is required"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description needs more detail"),
  price: z.coerce.number().min(0.1, "Price required"),
  stock: z.coerce.number().min(0, "Stock required"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
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

type FormValues = z.infer<typeof formSchema>;

interface ProductEditFormProps {
  product: Product;
  isModal?: boolean;
  onSuccess?: () => void;
}

export default function ProductEditForm({ product, isModal, onSuccess }: ProductEditFormProps) {
  const { data: session } = useSession();
  const isContentEditor = (session?.user as { role?: string })?.role === "CONTENT_EDITOR";
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // States for Categories
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      image: product.image || "",
      categoryId: product.categoryId || "",
      colors: product.colors || [],
      switchType: product.switchType || "",
      brand: product.brand || "",
      sku: product.sku || "",
      dpi: product.dpi || "",
      weight: product.weight || "",
      connectionType: product.connectionType || "",
      pollingRate: product.pollingRate || "",
      sensor: product.sensor || "",
      warranty: product.warranty || "",
      availability: product.availability || "In Stock",
      isActive: product.isActive ?? true,
      scheduledAt: product.scheduledAt ? new Date(product.scheduledAt).toISOString().slice(0, 16) : "",
      specs: product.specs as Record<string, string>,
    },
    mode: "onChange",
  });

  const watchedValues = form.watch() as FormValues;

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const res = await updateProduct(product.id, data);

      if (res.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="font-semibold">Product Updated Successfully!</span>
          </div>
        );
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/products");
          router.refresh();
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-36 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        {!isModal && (
          <div className="pt-10 pb-8 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Link
                  href="/admin/products"
                  className="p-3 bg-white dark:bg-gray-900 border border-neutral-200 rounded-2xl hover:bg-neutral-50 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                >
                  <ArrowLeft size={22} className="text-neutral-600 group-hover:text-indigo-600 transition-colors" />
                </Link>
                <div>
                  <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Edit Product</h1>
                  <p className="text-sm text-neutral-500 font-medium">
                    Modifying <span className="text-indigo-600 font-bold">{product.name}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 text-sm font-bold border rounded-xl transition-all shadow-sm group",
                    isPreviewOpen 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white dark:bg-gray-900 border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  {isPreviewOpen ? <EyeOff size={18} /> : <Eye size={18} className="text-neutral-400 group-hover:text-indigo-600" />}
                  {isPreviewOpen ? "Hide Preview" : "Show Preview"}
                </button>
                <Link
                  href={`/products/${watchedValues.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-neutral-700 bg-white dark:bg-gray-900 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all shadow-sm group"
                >
                  <ExternalLink size={18} className="text-neutral-400 group-hover:text-indigo-600" />
                  View on Store
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="px-6">
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* --- LEFT COLUMN: Primary Details --- */}
            <div className="lg:col-span-2 space-y-8">
              {/* General Info */}
              <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Info size={20} className="text-indigo-600" /> General Information
                </h2>
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Product Name
                    </label>
                    <input
                      {...form.register("name")}
                      onChange={handleNameChange}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                          /products/
                        </span>
                        <input
                          {...form.register("slug")}
                          className="w-full pl-24 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none font-mono text-sm font-semibold"
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
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-600 transition-colors"
                          title="Regenerate from Name"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>

                      {watchedValues.slug && (
                        <Link
                          href={`/products/${watchedValues.slug}`}
                          target="_blank"
                          className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-indigo-600 transition-colors shrink-0"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Layers
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                          size={18}
                        />
                        <select
                          {...form.register("categoryId")}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer font-medium"
                        >
                          <option value="">Select a category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {isLoadingCategories && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2
                              className="animate-spin text-indigo-600"
                              size={16}
                            />
                          </div>
                        )}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>

                      <div className="shrink-0">
                        <CategoryModal />
                      </div>

                      <button
                        type="button"
                        onClick={fetchCategories}
                        className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
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
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Description
                    </label>
                    <textarea
                      {...form.register("description")}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none resize-none font-medium transition-all"
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

              {/* Media Card */}
              <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Media</h2>
                <div className="space-y-4">
                  {watchedValues.image ? (
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 group h-64 w-full flex items-center justify-center">
                      <div className="relative h-full w-full">
                        <Image
                          src={watchedValues.image}
                          alt="Product Image"
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="absolute top-4 right-4">
                        <button
                          type="button"
                          onClick={() =>
                            form.setValue("image", "", {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          className="bg-white dark:bg-neutral-900 text-red-500 p-2.5 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ImageUpload
                      value={[]}
                      disabled={isPending}
                      onChange={(url) =>
                        form.setValue("image", url, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      onRemove={() =>
                        form.setValue("image", "", { shouldValidate: true })
                      }
                    />
                  )}
                  {form.formState.errors.image && (
                    <p className="text-red-500 text-xs mt-2">
                      {form.formState.errors.image.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Specifications Card */}
              <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                  <Zap size={80} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Zap size={20} className="text-indigo-600" /> Technical Specifications
                </h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Switch Type */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[10px] block">
                        Keyboard Switch Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Linear", "Tactile", "Clicky", "Optical"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => form.setValue("switchType", type, { shouldDirty: true })}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                              watchedValues.switchType === type
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-indigo-200 dark:hover:border-indigo-900/30"
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
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                      />
                    </div>

                    {/* Colors */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[10px] block">
                        Available Colors
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {watchedValues.colors?.map((color: string, index: number) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg group animate-in fade-in zoom-in duration-200"
                          >
                            <div 
                               className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-600"
                               style={{ backgroundColor: color.toLowerCase() }}
                            />
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-tighter">{color}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = [...(watchedValues.colors || [])];
                                newColors.splice(index, 1);
                                form.setValue("colors", newColors, { shouldDirty: true });
                              }}
                              className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(!watchedValues.colors || watchedValues.colors.length === 0) && (
                          <p className="text-xs text-neutral-400 italic">No colors added yet.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          id="color-input-edit"
                          placeholder="Add color (e.g. Red, #FF0000)"
                          className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
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
                            const input = document.getElementById("color-input-edit") as HTMLInputElement;
                            const value = input.value.trim();
                            if (value) {
                              const currentColors = watchedValues.colors || [];
                              if (!currentColors.includes(value)) {
                                form.setValue("colors", [...currentColors, value], { shouldDirty: true });
                              }
                              input.value = "";
                            }
                          }}
                          className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-indigo-600 transition-all cursor-pointer"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <hr className="border-neutral-100 dark:border-neutral-800" />

                  {/* Technical Index Matrix */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter block">
                          Technical Index Matrix
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Edit parameters used in the comparison matrix.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(watchedValues.specs || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800 group">
                           <div className="flex-1 min-w-0">
                             <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">{key}</div>
                             <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{value as string}</div>
                           </div>
                           <button
                             type="button"
                             onClick={() => {
                               const currentSpecs = { ...(watchedValues.specs || {}) };
                               delete currentSpecs[key];
                               form.setValue("specs", currentSpecs, { shouldDirty: true });
                             }}
                             className="p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                           >
                              <X size={16} />
                           </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                       <input 
                        id="spec-key-edit"
                        placeholder="Key (e.g. Brand)"
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-indigo-500"
                       />
                       <input 
                        id="spec-value-edit"
                        placeholder="Value (e.g. Logitech)"
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const keyInput = document.getElementById("spec-key-edit") as HTMLInputElement;
                            const valueInput = document.getElementById("spec-value-edit") as HTMLInputElement;
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
                            const keyInput = document.getElementById("spec-key-edit") as HTMLInputElement;
                            const valueInput = document.getElementById("spec-value-edit") as HTMLInputElement;
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
                         className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                       >
                         <Plus size={16} /> Add
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN: Sidebar Metadata & Settings --- */}
            <div className="lg:col-span-1 space-y-8">
              {/* Status & Scheduling */}
              <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <RefreshCw size={20} className="text-indigo-600" /> Status & Scheduling
                </h2>
                <div className="space-y-6">
                  {/* Active Toggle */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block">
                      Product Status
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => form.setValue("isActive", !watchedValues.isActive, { shouldDirty: true })}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                          watchedValues.isActive ? "bg-indigo-600" : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out",
                            watchedValues.isActive ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {watchedValues.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Inactive products won't be visible to customers.
                    </p>
                  </div>

                  {/* Scheduled Date */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block">
                      Scheduled Launch (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      {...form.register("scheduledAt")}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Product will go live automatically at this time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">
                  Pricing & Inventory
                </h2>
                <div className="space-y-6">
                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Price (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={isContentEditor}
                        {...form.register("price")}
                        className={cn(
                          "w-full pl-10 pr-4 py-3 rounded-xl border font-bold text-lg outline-none transition-all",
                          isContentEditor
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border-neutral-200 dark:border-neutral-700"
                            : "bg-neutral-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 text-neutral-900 dark:text-neutral-100"
                        )}
                      />
                    </div>
                    {isContentEditor && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold mt-1.5">
                        ⚠️ Price editing is locked for Content Editors.
                      </p>
                    )}
                    {form.formState.errors.price && (
                      <p className="text-red-500 text-xs mt-2">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      {...form.register("stock")}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none font-bold"
                    />
                    {form.formState.errors.stock && (
                      <p className="text-red-500 text-xs mt-2">
                        {form.formState.errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Technical Specs (Collapsible Accordion) */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-colors">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-6 sm:p-8 flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={20} className="text-indigo-600" />
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                      Advanced Tech Specs
                    </h2>
                  </div>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "text-neutral-500 transition-transform duration-300",
                      isAdvancedOpen && "transform rotate-180"
                    )}
                  />
                </button>

                {isAdvancedOpen && (
                  <div className="p-6 sm:p-8 pt-0 border-t border-neutral-100 dark:border-neutral-800 space-y-6">
                    <div className="grid grid-cols-1 gap-6 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Brand</label>
                        <input 
                          {...form.register("brand")}
                          placeholder="e.g. Logitech, Razer"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">SKU / Model</label>
                        <input 
                          {...form.register("sku")}
                          placeholder="e.g. G-PRO-WL-01"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Availability Status</label>
                        <div className="relative">
                          <select
                            {...form.register("availability")}
                            className="w-full px-4 py-3 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold appearance-none cursor-pointer"
                          >
                            <option value="In Stock">In Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                            <option value="Pre-Order">Pre-Order</option>
                            <option value="Discontinued">Discontinued</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Sensor Technology</label>
                        <input 
                          {...form.register("sensor")}
                          placeholder="e.g. HERO 25K, Focus Pro"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Max DPI / Sensitivity</label>
                        <input 
                          {...form.register("dpi")}
                          placeholder="e.g. 25,600 DPI"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Product Weight</label>
                        <input 
                          {...form.register("weight")}
                          placeholder="e.g. 63g (Ultra-light)"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Connection Type</label>
                        <input 
                          {...form.register("connectionType")}
                          placeholder="e.g. LIGHTSPEED, Bluetooth"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Polling Rate</label>
                        <input 
                          {...form.register("pollingRate")}
                          placeholder="e.g. 1000Hz, 8000Hz"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Warranty Period</label>
                        <input 
                          {...form.register("warranty")}
                          placeholder="e.g. 2 Year Limited"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500 outline-none text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Slide-out Preview Drawer */}
        {!isModal && (
          <>
            {/* Backdrop */}
            {isPreviewOpen && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-90 animate-in fade-in duration-300"
                onClick={() => setIsPreviewOpen(false)}
              />
            )}

            <div className={cn(
              "fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-gray-900 shadow-2xl z-100 transition-transform duration-500 ease-in-out border-l border-gray-100 dark:border-gray-800 flex flex-col",
              isPreviewOpen ? "translate-x-0" : "translate-x-full"
            )}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Eye size={20} />
                  </div>
                  <h3 className="font-black text-xl text-neutral-900 tracking-tight">Live Preview</h3>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2.5 hover:bg-neutral-100 rounded-xl transition-all active:scale-95 group"
                >
                  <X size={20} className="text-neutral-400 group-hover:text-neutral-900" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/50">
                <div className="flex items-center gap-2 mb-2 text-gray-400 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest">Store Front View</span>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-sm ring-1 ring-gray-100 rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl shadow-indigo-500/5">
                    <ProductCard
                      data={{
                        id: product.id,
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
                        createdAt: product.createdAt,
                        updatedAt: new Date(),
                        categoryId: watchedValues.categoryId || null,
                        category: {
                          id: watchedValues.categoryId || "temp",
                          name: categories.find((c) => c.id === watchedValues.categoryId)?.name || "Uncategorized",
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
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Stock Level</p>
                      <p className={cn("text-lg font-black", watchedValues.stock > 10 ? "text-emerald-600" : "text-amber-600")}>
                        {watchedValues.stock} units
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Price Point</p>
                      <p className="text-lg font-black text-neutral-900">
                        ${watchedValues.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Glassmorphism Sticky Bottom Bar */}
      <div className={cn(
        "sticky bottom-6 mx-auto w-full max-w-[1400px] z-60 px-6",
        isModal && "relative bottom-0 px-0 mt-10 z-0"
      )}>
        <div className={cn(
          "bg-white dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-4 sm:p-5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 ring-1 ring-black/5",
          isModal && "rounded-2xl shadow-none border-neutral-100 bg-neutral-50/50 backdrop-blur-none"
        )}>
          <div className="flex items-center gap-4 pl-2">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500",
              form.formState.isDirty 
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50" 
                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
            )}>
              <div className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  form.formState.isDirty ? "bg-amber-400" : "bg-emerald-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  form.formState.isDirty ? "bg-amber-500" : "bg-emerald-500"
                )}></span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                {form.formState.isDirty ? "Unsaved Changes" : "Everything Saved"}
              </span>
            </div>
            
            {form.formState.isDirty && (
              <button
                type="button"
                onClick={() => form.reset()}
                className="text-xs font-bold text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1.5 px-2"
              >
                <RefreshCw size={14} />
                Discard
              </button>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {!isModal && (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-8 py-3.5 text-sm font-black text-neutral-600 bg-neutral-100/50 hover:bg-neutral-100 rounded-2xl transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending || (!form.formState.isDirty && !isModal)}
              className={cn(
                "flex-1 sm:flex-none px-12 py-3.5 text-sm font-black text-white rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                form.formState.isDirty 
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300" 
                  : "bg-neutral-800 hover:bg-black shadow-neutral-200"
              )}
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isModal ? "Save Details" : (isPending ? "Updating..." : "Update Product")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
