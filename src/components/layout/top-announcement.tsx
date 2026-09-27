"use client";

import Link from "next/link";
import { sanitizeUrl } from "@/lib/utils";

interface TopAnnouncementProps {
  data: {
    topBarText: string | null;
    topBarLink: string | null;
    topBarActive: boolean;
  } | null;
}

export default function TopAnnouncement({ data }: TopAnnouncementProps) {
  // 1. If no data or disabled by admin -> Return null
  if (!data || !data.topBarActive || !data.topBarText) return null;

  return (
    <div className="bg-indigo-900 text-white text-[11px] sm:text-xs font-medium tracking-wide text-center py-2 px-4 transition-all relative z-50">
      <div className="container mx-auto break-words leading-relaxed">
        {data.topBarText}
        {data.topBarLink && (
          <>
            {" — "}
            <Link
              href={sanitizeUrl(data.topBarLink)}
              className="inline-block text-gray-400 border-b border-gray-400 pb-0.5 cursor-pointer hover:text-white transition"
            >
              Shop Now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
