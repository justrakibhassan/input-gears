"use client";


import { useState } from "react";
import Image from "next/image";
import { Trash2, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia } from "@/modules/admin/actions/media-actions";
import { Media } from "@prisma/client";

interface MediaGalleryProps {
  initialMedia: Media[];
}

export function MediaGallery({ initialMedia }: MediaGalleryProps) {
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset from the library?")) return;

    try {
      const res = await deleteMedia(id);
      if (res.success) {
        setMedia(media.filter((item) => item.id !== id));
        toast.success("Asset deleted from library");
      } else {
        toast.error("Failed to delete asset");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  if (media.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center">
        <p className="text-muted-foreground">No media assets found in the library.</p>
        <p className="text-xs text-muted-foreground mt-1">Upload an image in products or categories to see it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {media.map((item) => (
        <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border bg-gray-50 dark:bg-gray-800/50 hover:shadow-xl transition-all">
          <Image
            src={item.url}
            alt={item.name || "Media asset"}
            fill
            className="object-cover transition-transform group-hover:scale-110"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => handleCopy(item.url, item.id)}
              className="p-2 bg-white dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-900/40 rounded-lg text-white transition-colors backdrop-blur-md"
              title="Copy URL"
            >
              {copiedId === item.id ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-900/40 rounded-lg text-white transition-colors backdrop-blur-md"
              title="View Large"
            >
              <ExternalLink size={18} />
            </a>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 bg-red-500/20 hover:bg-red-500/60 rounded-lg text-red-100 transition-colors backdrop-blur-md"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
            <p className="text-[10px] text-white font-medium truncate">{item.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
