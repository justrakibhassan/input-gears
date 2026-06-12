"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Megaphone,
  LayoutTemplate,
  ExternalLink,
  Loader2,
  GripVertical,
  Zap,
  MousePointer2,
  Cpu,
  Headphones,
  Laptop,
  Keyboard,
  Monitor,
  Gamepad2,
  Search,
  ShoppingBag,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import CloudinaryUpload from "@/components/ui/cloudinary-upload";
import StatusBadge from "@/modules/admin/components/status-badge";
import { 
  updateHeroSlides, 
  updateTopBar, 
  updateBrandLogos,
} from "../actions";

// --- Zod Schemas ---
const topBarSchema = z
  .object({
    text: z.string().optional(),
    link: z.string().optional(),
    isActive: z.boolean(),
    useSchedule: z.boolean(),
    topBarStart: z.string().optional(),
    topBarEnd: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.useSchedule && data.topBarStart && data.topBarEnd) {
        return new Date(data.topBarEnd) > new Date(data.topBarStart);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["topBarEnd"],
    }
  );

const slideSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  link: z.string().optional(),
});

const slidesFormSchema = z.object({
  slides: z.array(slideSchema),
});

const brandLogoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  image: z.string().min(1, "Image is required"),
  isActive: z.boolean().default(true),
});

const themeSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  bgColor: z.string(),
  textColor: z.string(),
  brandTickerSpeed: z.number().min(5).max(300),
});

// ✅ Type Definitions
type TopBarFormValues = z.infer<typeof topBarSchema>;
type SlidesFormValues = z.infer<typeof slidesFormSchema>;

interface AppearanceFormProps {
  initialSettings: {
    id: string;
    topBarText: string | null;
    topBarLink: string | null;
    topBarActive: boolean;
    topBarStart: Date | null;
    topBarEnd: Date | null;
    updatedAt: Date;
  } | null;
  initialSlides: {
    id: string;
    title: string | null;
    subtitle: string | null;
    image: string;
    link: string | null;
  }[];
  initialBrandLogos: {
    id: string;
    name: string;
    image: string;
    isActive: boolean;
  }[];
}

  export default function AppearancePage({
  initialSettings,
  initialSlides,
  initialBrandLogos,
}: AppearanceFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [savingBar, setSavingBar] = useState(false);
  const [savingSlides, setSavingSlides] = useState(false);
  const [savingBrands, setSavingBrands] = useState(false);
  const activeBrandIndexRef = useRef<number | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);



  // --- Helper: Date Conversion (Date Object -> Local Input String) ---
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    // 🌏 Convert to local time string for the datetime-local input
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16); 
  };

  // 1. Top Bar Form
  const barForm = useForm<TopBarFormValues>({
    resolver: zodResolver(topBarSchema),
    defaultValues: {
      text: initialSettings?.topBarText || "",
      link: initialSettings?.topBarLink || "",
      isActive: initialSettings?.topBarActive ?? true,
      // Check if dates exist to toggle schedule switch
      useSchedule: !!(
        initialSettings?.topBarStart || initialSettings?.topBarEnd
      ),
      topBarStart: formatDate(initialSettings?.topBarStart),
      topBarEnd: formatDate(initialSettings?.topBarEnd),
    },
  });

  // 2. Slides Form
  const formattedSlides =
    initialSlides.length > 0
      ? initialSlides.map((slide) => ({
          id: slide.id,
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          image: slide.image,
          link: slide.link || "",
        }))
      : [];

  const slidesForm = useForm<SlidesFormValues>({
    resolver: zodResolver(slidesFormSchema),
    defaultValues: {
      slides: formattedSlides,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: slidesForm.control,
    name: "slides",
  });

  const brandForm = useForm({
    defaultValues: {
      brands: initialBrandLogos,
    },
  });

  const { fields: brandFields, append: appendBrand, remove: removeBrand, move: moveBrand } = useFieldArray({
    control: brandForm.control,
    name: "brands",
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [draggedBrandIndex, setDraggedBrandIndex] = useState<number | null>(null);
  const [draggedOverBrandIndex, setDraggedOverBrandIndex] = useState<number | null>(null);

  // Watchers
  const watchedBar = barForm.watch();
  const watchedSlides = slidesForm.watch();
  const watchedBrands = brandForm.watch();
  const watchedTopBarStart = barForm.watch("topBarStart");

  // --- Helper: Current DateTime for Min Attribute ---
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const currentDateTime = getCurrentDateTime();

  // --- Preview Slider Logic ---
  useEffect(() => {
    if (!watchedSlides.slides || watchedSlides.slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPreviewIndex((prev) =>
        prev === watchedSlides.slides.length - 1 ? 0 : prev + 1
      );
    }, 4000); // 4 seconds interval for smoother preview
    return () => clearInterval(interval);
  }, [watchedSlides.slides.length, watchedSlides.slides]);

  const onSaveBar = async (data: TopBarFormValues) => {
    setSavingBar(true);
    try {
      // 🌏 Convert local time string to absolute ISO string for the server
      const topBarStart = data.topBarStart ? new Date(data.topBarStart).toISOString() : "";
      const topBarEnd = data.topBarEnd ? new Date(data.topBarEnd).toISOString() : "";

      await updateTopBar({
        text: data.text || "",
        link: data.link || "",
        isActive: data.isActive,
        useSchedule: data.useSchedule,
        topBarStart,
        topBarEnd,
      });
      toast.success("Notification bar updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update top bar");
    } finally {
      setSavingBar(false);
    }
  };

  const onSaveSlides = async (data: SlidesFormValues) => {
    setSavingSlides(true);
    try {
      await updateHeroSlides(data.slides);
      toast.success("Hero slider updated!");
    } catch {
      toast.error("Failed to update slides");
    } finally {
      setSavingSlides(false);
    }
  };

  const onSaveBrands = async (data: { brands: { name: string; image: string }[] }) => {
    setSavingBrands(true);
    try {
      await updateBrandLogos(data.brands);
      toast.success("Brand logos updated!");
    } catch {
      toast.error("Failed to update brand logos");
    } finally {
      setSavingBrands(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* 1. Sticky Header Toolbar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Store Appearance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize Homepage & Banners</p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium ${
            showPreview
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 shadow-sm dark:shadow-none"
          }`}
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPreview ? "Close Preview" : "Live Preview"}
        </button>
      </div>

      {/* 2. Main Content Grid */}
      <div
        className={`p-6 transition-all duration-500 ease-in-out ${
          showPreview
            ? "grid grid-cols-1 xl:grid-cols-2 gap-8"
            : "max-w-4xl mx-auto"
        }`}
      >
        {/* --- LEFT SIDE: FORMS --- */}
        <div className="space-y-8">
          {/* Top Bar Form */}
          <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none group hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Megaphone size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      Top Notification Bar
                    </h2>
                    {/* ✅ Status Badge */}
                    <StatusBadge
                      isActive={barForm.watch("isActive")}
                      useSchedule={barForm.watch("useSchedule")}
                      startDate={barForm.watch("topBarStart")}
                      endDate={barForm.watch("topBarEnd")}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage announcements & offers.
                  </p>
                </div>
              </div>

              <button
                onClick={barForm.handleSubmit(onSaveBar)}
                disabled={savingBar || !barForm.formState.isDirty}
                className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md dark:shadow-none"
              >
                {savingBar ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save Bar
              </button>
            </div>

            <div className="space-y-6">
              {/* --- CONTROL PANEL --- */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* 1. Master Switch (Active/Inactive) */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="barActive"
                      {...barForm.register("isActive")}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor="barActive"
                        className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer block"
                      >
                        Enable Notification Bar
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Toggle this to show/hide the bar globally.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Mode Selection (Visible only if Active) */}
                {barForm.watch("isActive") && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="useSchedule"
                        {...barForm.register("useSchedule")}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <label
                        htmlFor="useSchedule"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                      >
                        Run on a specific schedule?
                      </label>
                    </div>

                    {/* Schedule Inputs */}
                    {barForm.watch("useSchedule") ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                            Start Time
                          </label>
                          <input
                            type="datetime-local"
                            {...barForm.register("topBarStart")}
                            min={currentDateTime}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                            End Time
                          </label>
                          <input
                            type="datetime-local"
                            {...barForm.register("topBarEnd")}
                            min={watchedTopBarStart || currentDateTime}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:border-amber-500 outline-none"
                          />
                          {barForm.formState.errors.topBarEnd && (
                            <p className="text-red-500 text-xs mt-1">
                              {barForm.formState.errors.topBarEnd.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pl-8 text-xs text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Currently set to{" "}
                        <strong className="text-blue-600">
                          Always Active
                        </strong>{" "}
                        (Permanent)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Text Inputs */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                    Announcement Text
                  </label>
                  <input
                    {...barForm.register("text")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Summer Sale is Live!"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                    Link URL
                  </label>
                  <input
                    {...barForm.register("link")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-indigo-600 focus:border-indigo-500 outline-none transition-all"
                    placeholder="/products/sale"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Hero Slider Form */}
          <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none group hover:border-indigo-200 transition-colors">
            {/* Slider Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <LayoutTemplate size={20} />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white">Hero Slider</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    append({ title: "", subtitle: "", image: "", link: "" })
                  }
                  className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={16} /> Add Slide
                </button>
                <button
                  onClick={slidesForm.handleSubmit(onSaveSlides)}
                  disabled={savingSlides || !slidesForm.formState.isDirty}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md dark:shadow-none shadow-indigo-200"
                >
                  {savingSlides ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Slides
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDraggedOverIndex(index)}
                  onDrop={(e) => {
                    const dragIndexStr = e.dataTransfer.getData("drag-index");
                    if (dragIndexStr) {
                      const dragIndex = parseInt(dragIndexStr, 10);
                      if (dragIndex !== index) {
                        move(dragIndex, index);
                      }
                    }
                    setDraggedOverIndex(null);
                    setDraggedIndex(null);
                  }}
                  className={`bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border transition-all relative group ${
                    draggedOverIndex === index
                      ? "border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-md dark:shadow-none shadow-indigo-100/50"
                      : "border-gray-200 dark:border-gray-700 hover:shadow-sm dark:shadow-none"
                  } ${draggedIndex === index ? "opacity-40 scale-95 border-dashed border-gray-300" : ""}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("drag-index", index.toString());
                        setDraggedIndex(index);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDraggedOverIndex(null);
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-grab active:cursor-grabbing hover:text-indigo-600 transition-colors select-none"
                    >
                      <GripVertical size={14} /> Slide {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Upload */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                        Banner Image
                      </label>
                      <CloudinaryUpload
                        value={slidesForm.watch(`slides.${index}.image`)}
                        onChange={(url) =>
                          slidesForm.setValue(`slides.${index}.image`, url, {
                            shouldValidate: true,
                          })
                        }
                        onRemove={() =>
                          slidesForm.setValue(`slides.${index}.image`, "")
                        }
                      />
                      {slidesForm.formState.errors.slides?.[index]?.image && (
                        <p className="text-red-500 text-xs ml-1">
                          {
                            slidesForm.formState.errors.slides[index]?.image
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                          Title (Optional)
                        </label>
                        <input
                          {...slidesForm.register(`slides.${index}.title`)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                          placeholder="Leave empty to hide"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                          Subtitle (Optional)
                        </label>
                        <input
                          {...slidesForm.register(`slides.${index}.subtitle`)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          placeholder="Leave empty to hide"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                        Redirect Link
                      </label>
                      <div className="relative h-full">
                        <ExternalLink
                          size={16}
                          className="absolute left-3 top-3.5 text-gray-400"
                        />
                        <input
                          {...slidesForm.register(`slides.${index}.link`)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-indigo-600"
                          placeholder="/collection/mens"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Brand Logos */}
          <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none group hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <LayoutTemplate size={20} />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white">Brand Logos</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => appendBrand({ id: "", name: "", image: "", isActive: true })}
                  className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={16} /> Add Brand
                </button>
                <button
                  onClick={brandForm.handleSubmit(onSaveBrands)}
                  disabled={savingBrands || !brandForm.formState.isDirty}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md dark:shadow-none shadow-blue-200"
                >
                  {savingBrands ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Brands
                </button>
              </div>
            </div>

            {/* Single shared CldUploadWidget for ALL brand logos */}
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/, "") || ""}
                options={{ maxFiles: 1, resourceType: "image", clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "svg"] }}
                onSuccess={(result: CloudinaryUploadWidgetResults) => {
                  const idx = activeBrandIndexRef.current;
                  if (idx !== null && result.info && typeof result.info !== "string" && result.info.secure_url) {
                    brandForm.setValue(`brands.${idx}.image`, result.info.secure_url, { shouldDirty: true });
                    activeBrandIndexRef.current = null;
                  }
                }}
              >
                {({ open }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brandFields.map((field, index) => {
                const imgUrl = brandForm.watch(`brands.${index}.image`);
                return (
                  <div 
                    key={field.id} 
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setDraggedOverBrandIndex(index)}
                    onDrop={(e) => {
                      const dragIndexStr = e.dataTransfer.getData("drag-brand-index");
                      if (dragIndexStr) {
                        const dragIndex = parseInt(dragIndexStr, 10);
                        if (dragIndex !== index) {
                          moveBrand(dragIndex, index);
                        }
                      }
                      setDraggedOverBrandIndex(null);
                      setDraggedBrandIndex(null);
                    }}
                    className={`group relative flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800/50 rounded-xl border transition-all duration-200 shadow-sm ${
                      draggedOverBrandIndex === index
                        ? "border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-md dark:shadow-none"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    } ${draggedBrandIndex === index ? "opacity-50 scale-95 border-dashed border-gray-300" : ""}`}
                  >
                    {/* Drag Handle */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("drag-brand-index", index.toString());
                        setDraggedBrandIndex(index);
                      }}
                      onDragEnd={() => {
                        setDraggedBrandIndex(null);
                        setDraggedOverBrandIndex(null);
                      }}
                      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-500 transition-colors p-1 pl-0 shrink-0"
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Brand logo thumbnail or upload button */}
                    <div className="w-12 h-12 shrink-0">
                      {imgUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100 group/img">
                          <img src={imgUrl} alt="logo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => brandForm.setValue(`brands.${index}.image`, "", { shouldDirty: true })}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 size={14} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { activeBrandIndexRef.current = index; open(); }}
                          className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50 flex flex-col items-center justify-center gap-0.5 transition-colors group/upload"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover/upload:text-indigo-500 transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span className="text-[8px] font-bold text-gray-400 group-hover/upload:text-indigo-500 uppercase transition-colors">Upload</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <input
                        {...brandForm.register(`brands.${index}.name`)}
                        className="w-full px-3 py-1.5 rounded-md border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white dark:bg-transparent dark:focus:bg-gray-900 text-sm font-bold uppercase tracking-widest transition-all text-gray-700 dark:text-gray-200"
                        placeholder="BRAND NAME"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBrand(index)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
                )}
              </CldUploadWidget>
          </section>

        </div>

        {/* --- RIGHT SIDE: STICKY PREVIEW --- */}
        {showPreview && (
          <div className="relative">
            <div className="sticky top-24 z-10 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Browser Mockup Bar */}
              <div className="bg-[#1e1e1e] rounded-t-xl px-4 py-3 flex items-center gap-4 shadow-2xl border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>
                <div className="flex-1 bg-[#3a3a3a] rounded-md flex justify-center py-1">
                  <span className="text-[11px] text-gray-400 font-medium font-sans flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">🔒</span> inputgears.com
                  </span>
                </div>
                <div className="w-10"></div>
              </div>

              {/* Viewport Area */}
              <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl shadow-2xl overflow-hidden h-[70vh] overflow-y-auto no-scrollbar relative">
                {/* 🌏 Top Bar Preview */}
                <AnimatePresence>
                  {watchedBar.isActive && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-indigo-900 text-white text-[10px] md:text-[11px] font-medium tracking-widest text-center py-2.5 uppercase px-4 truncate"
                    >
                      {watchedBar.text || "Announcement Text"} —{" "}
                      <span className="text-gray-400 border-b border-gray-400 pb-0.5">
                        Shop Now
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navbar Mockup */}
                <div className="border-b border-gray-100 dark:border-gray-800 py-4 px-6 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 backdrop-blur-md z-50">
                  <span className="font-bold text-xl tracking-tighter">
                    INPUT<span className="text-indigo-600">GEARS</span>
                  </span>
                  <div className="hidden lg:flex gap-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <span className="text-gray-900 dark:text-white">Home</span>
                    <span>Shop</span>
                    <span>Drop</span>
                  </div>
                  <div className="flex gap-4 text-gray-600 dark:text-gray-400">
                    <Search size={18} />
                    <ShoppingBag size={18} />
                    <Menu size={18} className="lg:hidden" />
                  </div>
                </div>

                {/* 🎭 Hero Banner Preview (Animated) */}
                <div className="p-4 md:p-6 bg-white dark:bg-gray-900">
                  <div className="relative w-full aspect-16/8 md:aspect-21/8 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-none bg-gray-50 dark:bg-gray-800 group isolate border border-gray-100 dark:border-gray-800">
                    <AnimatePresence mode="wait">
                      {watchedSlides.slides.length > 0 ? (
                        watchedSlides.slides.map((slide, index) => {
                          if (index !== currentPreviewIndex) return null;
                          const hasText = slide.title || slide.subtitle;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8 }}
                              className="absolute inset-0 w-full h-full"
                            >
                              {slide.image ? (
                                <>
                                  {slide.image.startsWith("http") || slide.image.startsWith("/") || slide.image.startsWith("data:") ? (
                                    <img
                                      src={slide.image}
                                      className="w-full h-full object-cover"
                                      alt="Preview"
                                    />
                                  ) : (
                                    <img
                                      src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${slide.image}`}
                                      className="w-full h-full object-cover"
                                      alt="Preview"
                                    />
                                  )}
                                  {hasText && (
                                    <>
                                      <div className="absolute inset-0 bg-black/20" />
                                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                                        {slide.subtitle && (
                                          <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2 opacity-90">
                                            {slide.subtitle}
                                          </p>
                                        )}
                                        {slide.title && (
                                          <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                                            {slide.title}
                                          </h2>
                                        )}
                                        <div className="mt-4 px-6 py-2 bg-white dark:bg-gray-900 text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                           Explore Now
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800">
                                  <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Visual Asset</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800 animate-pulse">
                          <span className="text-[10px] font-black uppercase tracking-widest">No Slides Configured</span>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Progress Indicators */}
                    {watchedSlides.slides.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {watchedSlides.slides.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              i === currentPreviewIndex
                                ? "w-8 bg-white dark:bg-gray-900"
                                : "w-2 bg-white dark:bg-gray-900/40"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Skeleton for Context */}
                <div className="px-6 pb-12 space-y-12">
                  <div className="space-y-6">
                    <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800" />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                       <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">Content Container</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Footer Info */}
              <div className="mt-4 p-4 bg-white dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                   Live Preview Synchronized
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
