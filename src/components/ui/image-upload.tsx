"use client";

import { useState, useSyncExternalStore } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Trash, CloudLightning, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { CloudinaryResult } from "@/types/cloudinary";
import { addToMediaLibrary } from "@/modules/admin/actions/media-actions";
import { MediaLibraryModal } from "@/modules/admin/components/media-library-modal";

const emptySubscribe = () => () => {};

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
}: ImageUploadProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/g, "");
  const isCloudinaryConfigured = !!cloudName && !!uploadPreset;

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Type Safe Upload Handler
  const onUpload = (result: unknown) => {
    if (result && typeof result === "object" && "info" in result) {
      const info = result.info as CloudinaryResult["info"];

      if (info.secure_url) {
        onChange(info.secure_url);
        // Automatically register to Media Library
        addToMediaLibrary(info.secure_url, info.original_filename || "");
        toast.success("Image uploaded successfully");
      }
    }
  };

  const handleLibrarySelect = (url: string) => {
    onChange(url);
    setIsLibraryOpen(false);
  };

  // Prevent hydration error
  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4 w-full">
      {/* Image Preview */}
      {value && value.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          {value.map((url) => (
            <div
              key={url}
              className="relative w-[150px] h-[150px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm group"
            >
              <div className="z-10 absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  disabled={disabled}
                  className="bg-red-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash size={14} />
                </button>
              </div>
              <Image fill className="object-cover" alt="Image" src={url} />
            </div>
          ))}
        </div>
      )}

      {/* Upload Controls Group */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Cloudinary Widget */}
        {isCloudinaryConfigured ? (
          <CldUploadWidget
            onSuccess={onUpload}
            uploadPreset={uploadPreset}
            options={{
              maxFiles: 1,
              sources: ["local", "url", "camera"],
              clientAllowedFormats: ["image"],
            }}
          >
            {({ open }) => {
              const onClick = () => {
                if (disabled) return;
                if (open) open();
              };

              return (
                <div
                  onClick={onClick}
                  className={`flex-1 border-2 border-dashed border-gray-200 rounded-3xl p-8 transition flex flex-col items-center justify-center gap-4 cursor-pointer group bg-white ${
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50/50 hover:border-indigo-200"
                  }`}
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <CloudLightning size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700 text-sm">Upload New</p>
                    <p className="text-[10px] text-gray-400 mt-1">Images, Graphics, etc.</p>
                  </div>
                </div>
              );
            }}
          </CldUploadWidget>
        ) : (
          <div className="flex-1 border-2 border-dashed border-red-100 bg-red-50/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-2 text-red-600">
            <p className="font-black text-xs uppercase tracking-widest text-center">Cloudinary Unconfigured</p>
            <p className="text-[9px] text-gray-500 text-center font-medium">Please restart `npm run dev` to load environment variables.</p>
          </div>
        )}

        {/* Media Library Trigger */}
        <div
          onClick={() => !disabled && setIsLibraryOpen(true)}
          className={`flex-1 border-2 border-dashed border-gray-200 rounded-3xl p-8 transition flex flex-col items-center justify-center gap-4 cursor-pointer group bg-white ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-50/30 hover:border-indigo-200"
          }`}
        >
          <div className="p-3 bg-gray-100 text-gray-500 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <ImageIcon size={24} />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-700 text-sm">Media Library</p>
            <p className="text-[10px] text-gray-400 mt-1">Select Existing Asset</p>
          </div>
        </div>
      </div>

      {isLibraryOpen && (
        <MediaLibraryModal
          onSelect={handleLibrarySelect}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}
    </div>
  );
}
