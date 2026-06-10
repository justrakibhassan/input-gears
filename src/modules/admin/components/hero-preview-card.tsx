import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeroPreviewProps {
  data: {
    title: string;
    subtitle?: string;
    image?: string;
    link?: string;
  };
}

export default function HeroPreviewCard({ data }: HeroPreviewProps) {
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none group">
      {/* Background Image */}
      {data.image ? (
        <Image
          src={data.image}
          alt="Hero Preview"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No Image Uploaded
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 text-white space-y-4">
        {data.subtitle && (
          <p className="text-sm md:text-base font-medium uppercase tracking-wider animate-in fade-in slide-in-from-bottom-3">
            {data.subtitle}
          </p>
        )}

        <h2 className="text-3xl md:text-5xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 delay-100">
          {data.title || "Your Title Here"}
        </h2>

        {data.link && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-5 delay-200">
            <Button className="rounded-full px-8 bg-white dark:bg-gray-900 text-black hover:bg-gray-200">
              Shop Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
