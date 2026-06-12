

import React from "react";
import {
  Zap,
  MousePointer2,
  Cpu,
  Headphones,
  Laptop,
  Keyboard,
  Monitor,
  Gamepad2,
  Package
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const fallbackIcons: Record<string, React.ElementType> = {
  "RAZER": Zap,
  "LOGITECH": MousePointer2,
  "CORSAIR": Cpu,
  "STEELSERIES": Headphones,
  "ASUS ROG": Laptop,
  "DUCKY": Keyboard,
  "ZOWIE": Monitor,
  "SENNHEISER": Headphones,
  "HYPERX": Gamepad2,
};

export default async function BrandTicker() {
  const dbBrands = await prisma.brandLogo.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (dbBrands.length === 0) return null;

  // Double the brands for seamless looping
  const tickerItems = [...dbBrands, ...dbBrands];


  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 mt-6 md:mt-8">
      <div className="w-full bg-white py-6 md:py-8 overflow-hidden rounded-2xl md:rounded-3xl border border-gray-100/60 relative group shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        {/* Background Gradient Ornaments */}
        <div className="absolute top-0 left-0 w-20 md:w-32 h-full bg-linear-to-r from-white via-white/70 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-20 md:w-32 h-full bg-linear-to-l from-white via-white/70 to-transparent z-10 pointer-events-none" />

        <div className="flex whitespace-nowrap animate-ticker group-hover:paused">
          {tickerItems.map((brand, index) => (
            <div
              key={index}
              className="flex items-center gap-3 mx-6 md:mx-10 group/item cursor-pointer"
            >
              <div className="text-gray-400 group-hover/item:text-indigo-600 transition-colors duration-300 w-8 h-8 md:w-10 md:h-10 relative flex items-center justify-center">
                {brand.image ? (
                  <img src={brand.image} alt={brand.name} className="max-w-full max-h-full object-contain grayscale opacity-50 group-hover/item:grayscale-0 group-hover/item:opacity-100 transition-all duration-300" />
                ) : (
                  (() => {
                    const FallbackIcon = fallbackIcons[brand.name.toUpperCase()] || Package;
                    return <FallbackIcon size={24} className="opacity-50 group-hover/item:opacity-100 transition-all duration-300" />;
                  })()
                )}
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-400 group-hover/item:text-gray-900 transition-colors duration-300 tracking-widest uppercase">
                {brand.name}
              </span>
            </div>
          ))}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-ticker {
            animation: ticker 50s linear infinite;
          }
        `}} />
      </div>
    </section>
  );
}
