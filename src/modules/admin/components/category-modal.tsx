"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, X, Loader2, Save } from "lucide-react";
import { createCategory } from "@/modules/admin/actions";
import ImageUpload from "@/components/ui/image-upload";
import { generateSlug } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image: z.string().optional(),
});

export default function CategoryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "", description: "", image: "" },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    form.setValue("slug", generateSlug(name), { shouldValidate: true });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Stop event propagation to prevent parent form submission
    try {
      setIsPending(true);
      const res = await createCategory(data);

      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        form.reset();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      {/* type="button" to prevent form submission/reload */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm dark:shadow-none"
        title="Quick Add Category"
      >
        <Plus size={18} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 animate-in fade-in transition-all duration-300" />
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 z-101">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Add New Category
              </h3>
              <button
                type="button" // ✅ Here too
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note: We are using a div instead of form tag here to avoid nesting issues if parent is a form */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  {...form.register("name")}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Headphones"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-xs">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug
                </label>
                <input
                  {...form.register("slug")}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 font-mono text-sm text-indigo-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icon / Image
                </label>
                <div className="w-full">
                  <ImageUpload
                    value={form.watch("image") ? [form.watch("image")!] : []}
                    onChange={(url) => form.setValue("image", url)}
                    onRemove={() => form.setValue("image", "")}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>

              {/* This button triggers the manual submit handler */}
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
