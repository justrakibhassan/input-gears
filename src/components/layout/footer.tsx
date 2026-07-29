"use client";
import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  Settings,
} from "lucide-react";

// --- Type Definitions (Strict Type Safety) ---

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
  icon: React.ElementType;
}

// --- Data Configuration ---

const FOOTER_LINKS: FooterColumn[] = [
  {
    title: "Shop & Account",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Sale Deals", href: "/sale" },
      { label: "Compare Gears", href: "/compare" },
      { label: "Track Order", href: "/track-order" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Return Policy", href: "/returns" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    title: "InputGears",
    links: [
      { label: "Gaming Keyboards", href: "/keyboards" },
      { label: "High Precision Mice", href: "/mice" },
      { label: "Pro Audio", href: "/audio" },
      { label: "Monitors", href: "/monitors" },
    ],
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  { platform: "Twitter", href: "#", icon: Twitter },
  { platform: "GitHub", href: "#", icon: Github },
  { platform: "LinkedIn", href: "#", icon: Linkedin },
];

// --- Components ---

export function Footer() {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800 text-zinc-400 font-sans">
      <div className="max-w-[1440px] mx-auto px-6 pt-16 pb-8">
        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white group w-fit"
            >
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-indigo-500/50 transition-colors">
                <Settings className="w-6 h-6 text-indigo-500 animate-[spin_10s_linear_infinite]" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Input Gears
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Building the next generation of mechanical intelligence tools.
              Optimized for performance, designed for scale.
            </p>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-white tracking-wide mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-indigo-400 transition-colors duration-200 block w-fit"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Stay Updated
            </h3>
            <p className="text-xs text-zinc-500">
              Join our newsletter for the latest updates and tech news.
            </p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
                e.preventDefault()
              }
            >
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-2 top-1.5 p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-linear-to-r from-transparent via-zinc-800 to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-zinc-500 order-2 md:order-1">
            &copy; {currentYear} Input Gears Inc. All rights reserved.
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 order-1 md:order-2">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.platform}
                href={item.href}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all duration-300 border border-transparent hover:border-zinc-700"
                aria-label={item.platform}
              >
                <item.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
