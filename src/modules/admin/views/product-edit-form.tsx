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
  Image as ImageIcon,
  Sparkles,
  DollarSign,
  Package,
  Sliders,
  Check,
  ChevronDown,
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
  image: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).default([]),
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
  specs: z.record(z.string(), z.unknown()).optional(),
});

export const STANDARD_SPEC_PRESETS = [
  { key: "layout", label: "Keyboard Layout", placeholder: "e.g. Compact 75% (80 Keys + Volume Knob)" },
  { key: "structure", label: "Mounting Structure", placeholder: "e.g. Gasket Mount with Flex-cut PC Plate" },
  { key: "battery", label: "Battery Capacity", placeholder: "e.g. 4000mAh Rechargeable" },
  { key: "hotSwappable", label: "Hot-Swappable", placeholder: "e.g. 3-pin & 5-pin TTC Switch Sockets" },
  { key: "keycaps", label: "Keycaps Profile", placeholder: "e.g. Double-shot PBT Cherry Profile" },
  { key: "backlight", label: "RGB Lighting", placeholder: "e.g. 16.8M Color South-facing RGB" },
  { key: "plate", label: "Plate Material", placeholder: "e.g. Flex-cut Polycarbonate (PC)" },
  { key: "dampening", label: "Sound Dampening", placeholder: "e.g. 5-Layer Acoustic Foam & Silicone Pad" },
];

type FormValues = z.infer<typeof formSchema>;

interface ProductEditFormProps {
  product: Product;
  isModal?: boolean;
  onSuccess?: () => void;
}

export default function ProductEditForm({
  product,
  isModal,
  onSuccess,
}: ProductEditFormProps) {
  const { data: session } = useSession();
  const isContentEditor =
    (session?.user as { role?: string })?.role === "CONTENT_EDITOR";
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");

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
      images:
        product.images && product.images.length > 0
          ? product.images
          : product.image
            ? [product.image]
            : [],
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
      scheduledAt: product.scheduledAt
        ? new Date(product.scheduledAt).toISOString().slice(0, 16)
        : "",
      specs: (product.specs as Record<string, unknown>) || {},
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

  const handleAddImageUrl = () => {
    const val = newImageUrl.trim();
    if (!val) return;
    const current = watchedValues.images || [];
    if (!current.includes(val)) {
      form.setValue("images", [...current, val], { shouldDirty: true });
      if (!watchedValues.image) {
        form.setValue("image", val, { shouldDirty: true });
      }
    }
    setNewImageUrl("");
  };

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const res = await updateProduct(product.id, data);

      if (res.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={18} />
            <span className="font-semibold text-sm">
              Product Updated Successfully!
            </span>
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
    <div className="w-full space-y-6">
      {/* Top Header Bar */}
      {!isModal && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3.5">
            <Link
              href="/admin/products"
              className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-2xs group cursor-pointer"
              title="Back to Products"
            >
              <ArrowLeft
                size={18}
                className="text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Edit Product
                </h1>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                    watchedValues.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {watchedValues.isActive ? "Active" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium truncate max-w-xl mt-0.5">
                {product.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-semibold border rounded-xl transition shadow-2xs cursor-pointer",
                isPreviewOpen
                  ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {isPreviewOpen ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{isPreviewOpen ? "Hide Preview" : "Store Preview"}</span>
            </button>
            <Link
              href={`/products/${watchedValues.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-2xs cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Live Page</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Form Grid: 70% Left Main / 30% Right Sidebar */}
      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- LEFT MAIN COLUMN (lg:col-span-8) --- */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: General Product Details */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Info size={16} className="text-indigo-600" /> Basic Information
              </h2>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register("name")}
                onChange={handleNameChange}
                placeholder="e.g. AULA F75 MAX Tri-Mode Wireless Mechanical Keyboard"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm font-semibold focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none transition"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* 2-Column Row: Slug & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
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
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Auto Generate
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-xs font-medium pointer-events-none">
                    /products/
                  </span>
                  <input
                    {...form.register("slug")}
                    className="w-full pl-20 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Layers
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={15}
                    />
                    <select
                      {...form.register("categoryId")}
                      className="w-full pl-8.5 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      {isLoadingCategories ? (
                        <Loader2 size={13} className="animate-spin text-indigo-600" />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </div>
                  </div>
                  <CategoryModal />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Product Description
              </label>
              <textarea
                {...form.register("description")}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-xs leading-relaxed focus:bg-white focus:border-indigo-500 outline-none resize-none font-medium transition"
                placeholder="Write an informative description highlighting key selling points, structure, and features..."
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-xs">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Media & Product Image Gallery */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={16} className="text-indigo-600" /> Product Images & Gallery
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload cover photo and all color variant photos for interactive switching.
                </p>
              </div>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                {watchedValues.images?.length || 0} Images
              </span>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {/* Primary Image or Upload Slot */}
              {watchedValues.images &&
                watchedValues.images.map((imgUrl: string, idx: number) => {
                  const isPrimary = watchedValues.image === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "group relative aspect-square rounded-xl overflow-hidden border bg-gray-50 dark:bg-gray-800/60 flex items-center justify-center p-2 transition-all",
                        isPrimary
                          ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                      )}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Product image ${idx + 1}`}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 120px, 160px"
                      />
                      {isPrimary && (
                        <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-xs pointer-events-none z-10 flex items-center gap-1">
                          <Check size={10} strokeWidth={3} /> Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() =>
                              form.setValue("image", imgUrl, { shouldDirty: true })
                            }
                            title="Set as Cover"
                            className="px-2 py-1 bg-white text-gray-900 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const nextImgs = (watchedValues.images || []).filter(
                              (_, i) => i !== idx
                            );
                            form.setValue("images", nextImgs, { shouldDirty: true });
                            if (isPrimary) {
                              form.setValue("image", nextImgs[0] || "", {
                                shouldDirty: true,
                              });
                            }
                          }}
                          title="Delete Image"
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-xs cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* Upload Dropzone Slot */}
              <div className="aspect-square rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition flex flex-col items-center justify-center p-2 text-center">
                <ImageUpload
                  value={[]}
                  disabled={isPending}
                  onChange={(url) => {
                    const currentImages = watchedValues.images || [];
                    if (!currentImages.includes(url)) {
                      form.setValue("images", [...currentImages, url], {
                        shouldDirty: true,
                      });
                    }
                    if (!watchedValues.image) {
                      form.setValue("image", url, { shouldDirty: true });
                    }
                  }}
                  onRemove={() => {}}
                />
              </div>
            </div>

            {/* Quick URL Adder Input */}
            <div className="flex gap-2 pt-2">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="Or paste direct image URL / file path (e.g. /AF75MBG-2048x1536.webp)"
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:bg-white focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:text-gray-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add to Gallery
              </button>
            </div>
          </div>

          {/* Card 3: Variants & Specifications Matrix */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-indigo-600" /> Variants & Specifications
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Switch Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  Keyboard Switch Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Linear", "Tactile", "Clicky", "Optical"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        form.setValue("switchType", type, { shouldDirty: true })
                      }
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center",
                        watchedValues.switchType === type
                          ? "bg-gray-900 border-gray-900 text-white shadow-2xs dark:bg-white dark:text-gray-900"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  {...form.register("switchType")}
                  placeholder="Custom switch specification (e.g. Reaper Switch)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Available Colors */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  Color Options
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                  {watchedValues.colors?.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                        style={{
                          backgroundColor: color.toLowerCase().includes("white")
                            ? "#fff"
                            : color.toLowerCase().includes("gradient") ||
                                color.toLowerCase().includes("black")
                              ? "#1f2937"
                              : color.toLowerCase(),
                        }}
                      />
                      <span className="text-gray-800 dark:text-gray-200">{color}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newColors = [...(watchedValues.colors || [])];
                          newColors.splice(index, 1);
                          form.setValue("colors", newColors, { shouldDirty: true });
                        }}
                        className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    id="color-input-edit"
                    placeholder="e.g. Ice Blue, Black Gradient"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white focus:border-indigo-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = document.getElementById(
                          "color-input-edit"
                        ) as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          const current = watchedValues.colors || [];
                          if (!current.includes(val)) {
                            form.setValue("colors", [...current, val], {
                              shouldDirty: true,
                            });
                          }
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        "color-input-edit"
                      ) as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        const current = watchedValues.colors || [];
                        if (!current.includes(val)) {
                          form.setValue("colors", [...current, val], {
                            shouldDirty: true,
                          });
                        }
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus size={14} /> Add Color
                  </button>
                </div>
              </div>
            </div>

            {/* Technical Index Matrix (Specs) */}
            <div className="pt-5 border-t border-gray-150 dark:border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    Technical Index Matrix (Specs)
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Hardware parameters automatically indexed in Quick Overview and Specification tables.
                  </p>
                </div>
              </div>

              {/* Quick Preset Badges (Unadded Parameters) */}
              {STANDARD_SPEC_PRESETS.filter(
                (preset) =>
                  !watchedValues.specs ||
                  !(
                    preset.key in (watchedValues.specs as Record<string, unknown>) ||
                    preset.label in (watchedValues.specs as Record<string, unknown>)
                  )
              ).length > 0 && (
                <div className="space-y-1.5 p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" /> Click to Add Recommended Parameter:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {STANDARD_SPEC_PRESETS.filter(
                      (preset) =>
                        !watchedValues.specs ||
                        !(
                          preset.key in (watchedValues.specs as Record<string, unknown>) ||
                          preset.label in (watchedValues.specs as Record<string, unknown>)
                        )
                    ).map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          const current = { ...(watchedValues.specs || {}) };
                          current[preset.key] = "";
                          form.setValue("specs", current, { shouldDirty: true });
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 hover:text-indigo-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Specs Grid with Direct Editable Value Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(watchedValues.specs || {})
                  .filter(
                    ([key, value]) => key !== "colorMap" && typeof value !== "object"
                  )
                  .map(([key, value]) => {
                    const preset = STANDARD_SPEC_PRESETS.find(
                      (p) => p.key.toLowerCase() === key.toLowerCase() || p.label.toLowerCase() === key.toLowerCase()
                    );
                    const displayLabel = preset ? preset.label : key;
                    const placeholder = preset ? preset.placeholder : `Enter ${key} specification...`;

                    return (
                      <div
                        key={key}
                        className="p-3 bg-gray-50/90 dark:bg-gray-800/70 rounded-xl border border-gray-200/90 dark:border-gray-700/80 space-y-1.5 transition-all focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-900 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {displayLabel}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSpecs = { ...(watchedValues.specs || {}) };
                              delete currentSpecs[key];
                              form.setValue("specs", currentSpecs, { shouldDirty: true });
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-800"
                            title="Remove Spec"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <input
                          value={String(value || "")}
                          onChange={(e) => {
                            const currentSpecs = { ...(watchedValues.specs || {}) };
                            currentSpecs[key] = e.target.value;
                            form.setValue("specs", currentSpecs, { shouldDirty: true });
                          }}
                          placeholder={placeholder}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Custom Parameter Adder */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1.5">
                  Add Custom Parameter:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="spec-key-edit"
                    placeholder="Parameter Name (e.g. Polling Rate, Software)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white focus:border-indigo-500 outline-none font-medium"
                  />
                  <input
                    id="spec-value-edit"
                    placeholder="Value (e.g. 1000Hz, VIA / QMK Web Driver)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white focus:border-indigo-500 outline-none font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const kInput = document.getElementById("spec-key-edit") as HTMLInputElement;
                        const vInput = document.getElementById("spec-value-edit") as HTMLInputElement;
                        const k = kInput?.value.trim();
                        const v = vInput?.value.trim();
                        if (k) {
                          const current = { ...(watchedValues.specs || {}) };
                          current[k] = v || "";
                          form.setValue("specs", current, { shouldDirty: true });
                          kInput.value = "";
                          vInput.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const kInput = document.getElementById("spec-key-edit") as HTMLInputElement;
                      const vInput = document.getElementById("spec-value-edit") as HTMLInputElement;
                      const k = kInput?.value.trim();
                      const v = vInput?.value.trim();
                      if (k) {
                        const current = { ...(watchedValues.specs || {}) };
                        current[k] = v || "";
                        form.setValue("specs", current, { shouldDirty: true });
                        kInput.value = "";
                        vInput.value = "";
                      }
                    }}
                    className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Parameter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDEBAR COLUMN (lg:col-span-4) --- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Status & Publishing */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <Sparkles size={16} className="text-indigo-600" /> Status & Visibility
            </h2>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  Store Visibility
                </div>
                <div className="text-[11px] text-gray-500">
                  {watchedValues.isActive
                    ? "Visible in catalog and search"
                    : "Hidden from customers"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  form.setValue("isActive", !watchedValues.isActive, {
                    shouldDirty: true,
                  })
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  watchedValues.isActive
                    ? "bg-emerald-500"
                    : "bg-gray-300 dark:bg-gray-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    watchedValues.isActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Scheduled Launch */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Scheduled Launch (Optional)
              </label>
              <input
                type="datetime-local"
                {...form.register("scheduledAt")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Card 2: Pricing & Stock Inventory */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <DollarSign size={16} className="text-indigo-600" /> Pricing & Inventory
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isContentEditor}
                    {...form.register("price")}
                    className={cn(
                      "w-full pl-7 pr-3 py-2 rounded-xl border text-sm font-bold outline-none",
                      isContentEditor
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-gray-50/50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white focus:border-indigo-500 text-gray-900 dark:text-white"
                    )}
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Stock Units <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="number"
                    {...form.register("stock")}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Brand & SKU */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  Brand
                </label>
                <input
                  {...form.register("brand")}
                  placeholder="e.g. AULA"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  SKU
                </label>
                <input
                  {...form.register("sku")}
                  placeholder="e.g. AULA-F75"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Advanced Hardware Specs (Collapsible) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-indigo-600" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Hardware & Connectivity Specs
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                {isAdvancedOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isAdvancedOpen && (
              <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 space-y-3 mt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Sensor Type
                  </label>
                  <input
                    {...form.register("sensor")}
                    placeholder="e.g. Optical Gaming Sensor"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Max DPI
                  </label>
                  <input
                    {...form.register("dpi")}
                    placeholder="e.g. 26,000 DPI"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Weight
                  </label>
                  <input
                    {...form.register("weight")}
                    placeholder="e.g. 980g (Solid Built)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Connectivity
                  </label>
                  <input
                    {...form.register("connectionType")}
                    placeholder="e.g. Tri-Mode (2.4GHz / Bluetooth 5.0 / Type-C)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Polling Rate
                  </label>
                  <input
                    {...form.register("pollingRate")}
                    placeholder="e.g. 1000Hz (1ms response)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Warranty
                  </label>
                  <input
                    {...form.register("warranty")}
                    placeholder="e.g. 1 Year Official Brand Warranty"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

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
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Eye size={20} />
                </div>
                <h3 className="font-black text-xl text-neutral-900 dark:text-white tracking-tight">Live Preview</h3>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-95 group cursor-pointer"
              >
                <X size={20} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/50 dark:bg-neutral-950">
              <div className="flex items-center gap-2 mb-2 text-gray-400 px-2">
                <span className="text-[10px] font-black uppercase tracking-widest">Store Front View</span>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-sm ring-1 ring-gray-100 dark:ring-neutral-800 rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl shadow-indigo-500/5">
                  <ProductCard
                    data={{
                      id: product.id,
                      name: watchedValues.name || "Product Name",
                      price: Number(watchedValues.price) || 0,
                      image: watchedValues.image || null,
                      images: watchedValues.images || [],
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
                      isOnSale: product.isOnSale ?? false,
                      salePrice: product.salePrice ?? null,
                      saleEndDate: product.saleEndDate ?? null,
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
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Stock Level</p>
                    <p className={cn("text-lg font-black", watchedValues.stock > 10 ? "text-emerald-600" : "text-amber-600")}>
                      {watchedValues.stock} units
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Price Point</p>
                    <p className="text-lg font-black text-neutral-900 dark:text-white">
                      ${watchedValues.price}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Action Bar (Full Width within Container) */}
      <div
        className={cn(
          "sticky bottom-0 -mx-4 md:-mx-6 -mb-4 md:-mb-6 px-6 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 z-40 shadow-lg",
          isModal && "relative bottom-0 mx-0 mb-0 px-0 shadow-none border-t-0"
        )}
      >
        {/* Left: Change Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
              form.formState.isDirty
                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  form.formState.isDirty ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  form.formState.isDirty ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </span>
            <span>
              {form.formState.isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>

          {form.formState.isDirty && (
            <button
              type="button"
              onClick={() => form.reset()}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition flex items-center gap-1 cursor-pointer px-2 py-1"
            >
              <RefreshCw size={12} /> Discard
            </button>
          )}
        </div>

        {/* Right: Save & Action Buttons */}
        <div className="flex items-center gap-3">
          {!isModal && (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending || (!form.formState.isDirty && !isModal)}
            className={cn(
              "px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
              form.formState.isDirty
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none"
                : "bg-gray-900 hover:bg-black dark:bg-gray-100 dark:text-gray-900 text-white"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={15} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{isModal ? "Save Details" : "Save & Update Product"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
