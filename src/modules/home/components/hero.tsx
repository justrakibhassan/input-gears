"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  TouchEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface HeroSlide {
  id: string;
  image: string;
  title?: string; // Optional
  subtitle?: string | null; // Optional
  link?: string | null;
}

interface HeroBannerProps {
  slides: HeroSlide[];
}

// --- Config ---
const AUTO_SLIDE_INTERVAL = 5000;
const MIN_SWIPE_DISTANCE = 50;

export default function HeroBanner({ slides }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Touch States ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // --- Navigation Logic ---
  const goToSlide = useCallback((index: number, newDirection: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDirection(newDirection);
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex === slides.length - 1 ? 0 : currentIndex + 1, 1);
  }, [currentIndex, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1, -1);
  }, [currentIndex, slides.length, goToSlide]);

  // --- Autoplay ---
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(() => nextSlide(), AUTO_SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, nextSlide, slides.length]);

  // --- Touch Handlers ---
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > MIN_SWIPE_DISTANCE) nextSlide();
    if (distance < -MIN_SWIPE_DISTANCE) prevSlide();
  };

  if (!slides || slides.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 mt-4 md:mt-6">
      <div
        className="relative w-full aspect-16/8 md:aspect-21/8 lg:aspect-24/8 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm select-none group isolate border border-gray-100"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          const hasText = slide.title || slide.subtitle;
          const isLocalOrExternal =
            slide.image.startsWith("/") || slide.image.startsWith("http");

          const SlideContent = (
            <>
              {isLocalOrExternal ? (
                <Image
                  src={slide.image}
                  alt={slide.title || "Banner Image"}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 1440px"
                />
              ) : (
                <CldImage
                  src={slide.image}
                  alt={slide.title || "Banner Image"}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 1440px"
                />
              )}

              {/* Overlay and text */}
              {hasText && (
                <>
                  <div className="absolute inset-0 bg-black/20" />{" "}
                  {/* Subtle overlay for readability */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                    {slide.subtitle && (
                      <p className="text-[10px] md:text-xs font-medium tracking-widest uppercase mb-2 opacity-90 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.title && (
                      <h2 className="text-2xl md:text-5xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {slide.title}
                      </h2>
                    )}
                  </div>
                </>
              )}
            </>
          );

          return (
            isActive && (
              <motion.div
                key={slide.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100, scale: 1.05 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  opacity: { duration: 0.4 },
                }}
                className="absolute inset-0 w-full h-full z-10"
              >
                {slide.link ? (
                  <Link
                    href={slide.link}
                    className="block w-full h-full relative cursor-pointer"
                  >
                    {SlideContent}
                  </Link>
                ) : (
                  <div className="w-full h-full relative">{SlideContent}</div>
                )}
              </motion.div>
            )
          );
        })}
        </AnimatePresence>

        {/* Controls */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/30 text-white rounded-full hover:bg-white/50 backdrop-blur-md hidden md:block"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/30 text-white rounded-full hover:bg-white/50 backdrop-blur-md hidden md:block"
            >
              <ChevronRight />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(i, i > currentIndex ? 1 : -1);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
