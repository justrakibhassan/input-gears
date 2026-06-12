"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget, CldImage, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function CloudinaryUpload({
  value,
  onChange,
  onRemove,
  disabled,
  compact = false,
}: CloudinaryUploadProps) {


  const onSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info !== "string" && result.info.secure_url) {
      onChange(result.info.secure_url);
    }
  };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/g, "");
  const isCloudinaryConfigured = !!cloudName && !!uploadPreset;



  const isLocalOrExternal = value.startsWith("/") || value.startsWith("http");

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {value ? (
            <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "relative w-full overflow-hidden border border-gray-100 group shadow-inner bg-white",
              compact ? "aspect-square rounded-xl" : "aspect-video md:aspect-21/9 rounded-[32px] bg-gray-50"
            )}
          >
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => onRemove()}
                className={cn(
                  "bg-white/90 hover:bg-white text-red-600 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all flex items-center justify-center",
                  compact ? "p-2" : "p-4"
                )}
              >
                <Trash2 size={compact ? 16 : 24} />
              </button>
            </div>
            
            {isLocalOrExternal ? (
              <Image
                fill
                src={value}
                alt="Image Preview"
                className="object-cover"
                unoptimized
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              <CldImage
                fill
                src={value}
                alt="Image Preview"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            {isCloudinaryConfigured ? (
              <CldUploadWidget
                onSuccess={onSuccess}
                uploadPreset={uploadPreset}
                options={{
                  maxFiles: 1,
                  resourceType: "image",
                  clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "svg"],
                  styles: {
                    palette: {
                      window: "#FFFFFF",
                      windowBorder: "#F3F4F6",
                      tabIcon: "#4F46E5",
                      menuIcons: "#1F2937",
                      textDark: "#111827",
                      textLight: "#FFFFFF",
                      link: "#4F46E5",
                      action: "#4F46E5",
                      inactiveTabIcon: "#9CA3AF",
                      error: "#EF4444",
                      inProgress: "#4F46E5",
                      complete: "#10B981",
                      sourceBg: "#F9FAFB",
                    },
                  },
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => open()}
                    className={cn(
                      "w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 hover:border-indigo-300 hover:text-indigo-600 transition-all group relative overflow-hidden bg-white",
                      disabled && "opacity-50 cursor-not-allowed",
                      compact ? "aspect-square rounded-xl gap-2 bg-gray-50/50" : "aspect-video md:aspect-21/9 gap-4 rounded-[32px] bg-gray-50/50"
                    )}
                  >
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {compact ? (
                      <>
                        <div className="text-gray-400 group-hover:text-indigo-600 transition-colors">
                          <UploadCloud size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Upload</span>
                      </>
                    ) : (
                      <>
                        <div className="p-5 bg-white rounded-3xl shadow-sm text-gray-400 group-hover:text-indigo-600 group-hover:shadow-indigo-100 transition-all">
                          <UploadCloud size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Deploy Visual Asset</p>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Recommended: 21:9 ratio</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="w-full aspect-video md:aspect-21/9 flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed border-red-200 bg-red-50/20 text-red-600 p-6">
                <p className="text-xs font-black uppercase tracking-widest text-center">Cloudinary is not configured</p>
                <p className="text-[10px] font-medium text-gray-500 text-center">Please configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env and restart the server.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
