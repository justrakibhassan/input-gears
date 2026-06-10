"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { getMedia } from "@/modules/admin/actions/media-actions";
import { Media } from "@prisma/client";
import { cn } from "@/lib/utils";

interface MediaLibraryModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaLibraryModal({ onSelect, onClose }: MediaLibraryModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const data = await getMedia();
        setMedia(data);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const filteredMedia = media.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Media Library</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select an existing image to re-use.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">Loading your assets...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full text-gray-300 mb-4">
                <ImageIcon size={48} />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white">No images found</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search or upload a new image.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedUrl(item.url)}
                  className={cn(
                    "group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all",
                    selectedUrl === item.url
                      ? "border-indigo-600 ring-4 ring-indigo-50 scale-95"
                      : "border-transparent hover:border-gray-200 dark:border-gray-700"
                  )}
                >
                  <Image
                    src={item.url}
                    alt={item.name || "Media asset"}
                    fill
                    className="object-cover"
                  />
                  {selectedUrl === item.url && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                      <div className="bg-white dark:bg-gray-900 rounded-full p-1 text-indigo-600 shadow-lg dark:shadow-none">
                        <CheckCircle2 size={24} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 dark:bg-gray-800/50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm dark:shadow-none rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedUrl && onSelect(selectedUrl)}
            disabled={!selectedUrl}
            className="px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-lg dark:shadow-none hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95"
          >
            Select Image
          </button>
        </div>
      </div>
    </div>
  );
}
