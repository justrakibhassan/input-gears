"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useCartDrawer } from "@/modules/cart/hooks/use-cart-drawer";
import { useMobileNav } from "./use-mobile-nav";
import MobileAccountMenu from "./mobile-account-menu";
import MobileSearchModal from "./mobile-search-modal";

const emptySubscribe = () => () => {};

interface NavItemProps {
  label: string;
  glyph: ReactNode;
  isActive?: boolean;
  href?: string;
  onClick?: () => void;
  isExpanded?: boolean;
}

function NavItem({
  label,
  glyph,
  isActive = false,
  href,
  onClick,
  isExpanded,
}: NavItemProps) {
  const itemClasses = `relative flex flex-1 flex-col items-center justify-center py-1.5 transition-all duration-200 outline-none select-none active:scale-95 ${
    isActive ? "text-white font-bold" : "text-white/80 hover:text-white font-medium"
  }`;

  const content = (
    <>
      <span className="flex items-center justify-center transition-transform duration-200">
        {glyph}
      </span>
      <span className="text-[9px] leading-none tracking-wider uppercase mt-1">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={itemClasses}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={itemClasses}
      aria-expanded={isExpanded}
    >
      {content}
    </button>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const cart = useCart();
  const { isOpen: isCartOpen, open: openCartDrawer } = useCartDrawer();
  const {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isMobileSearchOpen,
    toggleMobileSearch,
    closeMobileSearch,
  } = useMobileNav();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCartPopping, setIsCartPopping] = useState(false);
  const lastCartCount = useRef(0);
  const hasSyncedCart = useRef(false);

  const totalCartItems = isMounted
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  // Cart bounce / pop animation when items are added
  useEffect(() => {
    if (!isMounted) return;

    const previous = lastCartCount.current;
    lastCartCount.current = totalCartItems;

    if (!hasSyncedCart.current) {
      hasSyncedCart.current = true;
      return;
    }
    if (totalCartItems <= previous) return;

    const raf = requestAnimationFrame(() => setIsCartPopping(true));
    const timer = setTimeout(() => setIsCartPopping(false), 500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isMounted, totalCartItems]);

  const handleToggleMobileMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
    toggleMobileMenu();
  }, [toggleMobileMenu]);

  const handleToggleMobileSearch = useCallback(() => {
    setIsAccountMenuOpen(false);
    toggleMobileSearch();
  }, [toggleMobileSearch]);

  const handleOpenCart = useCallback(() => {
    setIsAccountMenuOpen(false);
    closeMobileMenu();
    closeMobileSearch();
    openCartDrawer();
  }, [closeMobileMenu, closeMobileSearch, openCartDrawer]);

  const handleToggleAccountMenu = useCallback(() => {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    closeMobileMenu();
    closeMobileSearch();
    setIsAccountMenuOpen((prev) => !prev);
  }, [session, router, closeMobileMenu, closeMobileSearch]);

  const handleCloseAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);

  const isHomeActive = pathname === "/";
  const isAccountActive =
    isAccountMenuOpen ||
    pathname.startsWith("/account") ||
    pathname === "/sign-in";

  return (
    <>
      <MobileSearchModal />
      <MobileAccountMenu
        isOpen={isAccountMenuOpen}
        onClose={handleCloseAccountMenu}
      />

      <nav
        aria-label="Mobile bottom navigation"
        data-mobile-bottom-nav
        className={`pointer-events-none fixed inset-x-2.5 bottom-2 z-1050 pb-safe transition-transform duration-300 ease-out select-none md:hidden ${
          isMobileMenuOpen ? "translate-y-[140%]" : "translate-y-0"
        }`}
      >
        <div className="pointer-events-auto relative mx-auto w-full max-w-lg">
          {/* Floating Center Cart Button */}
          <div className="absolute -top-[22px] left-1/2 z-20 -translate-x-1/2">
            <button
              type="button"
              onClick={handleOpenCart}
              aria-label={`Open cart, ${totalCartItems} items`}
              className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] ring-1 ring-white/10 outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-indigo-300 active:scale-90 ${
                isCartPopping ? "animate-cart-pop" : ""
              } ${isCartOpen ? "scale-95" : ""}`}
            >
              <ShoppingBag size={18} strokeWidth={1.8} className="text-white" />
              <span className="absolute -top-1 -right-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#222831] px-1 text-[8.5px] font-bold text-white border border-white/80 shadow-xs">
                {totalCartItems > 99 ? "99+" : totalCartItems}
              </span>
            </button>
          </div>

          {/* SVG Cutout Pill Background */}
          <div className="relative h-[62px] w-full drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
            <svg
              viewBox="0 0 800 68"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full text-[#222831] fill-current"
            >
              <path d="M766 0C784.778 0 800 15.2223 800 34C800 52.7777 784.778 68 766 68H34C15.2223 68 0 52.7777 0 34C0 15.2223 15.2223 0 34 0H339.239C353.506 0 364.975 13.2005 375.719 22.5877C382.012 28.0857 390.57 31.4668 400 31.4668C409.43 31.4668 417.988 28.0857 424.281 22.5877C435.025 13.2005 446.494 0 460.761 0H766Z" />
            </svg>

            {/* Navigation Tab Items Row */}
            <div className="relative z-10 flex h-full items-center justify-between px-3">
              {/* 1. Home */}
              <NavItem
                label="Home"
                href="/"
                isActive={isHomeActive}
                glyph={<Home size={18} strokeWidth={isHomeActive ? 2.2 : 1.75} />}
              />

              {/* 2. Menu */}
              <NavItem
                label="Menu"
                onClick={handleToggleMobileMenu}
                isActive={isMobileMenuOpen}
                isExpanded={isMobileMenuOpen}
                glyph={
                  <LayoutGrid
                    size={18}
                    strokeWidth={isMobileMenuOpen ? 2.2 : 1.75}
                  />
                }
              />

              {/* 3. Cart (Center Label Slot) */}
              <button
                type="button"
                onClick={handleOpenCart}
                aria-label="Open cart"
                className="flex flex-1 flex-col items-center justify-end h-full pb-2.5 outline-none select-none text-white/80 hover:text-white transition-colors active:scale-95"
              >
                <span className="text-[9px] leading-none tracking-wider uppercase font-semibold text-white">
                  Cart
                </span>
              </button>

              {/* 4. Search */}
              <NavItem
                label="Search"
                onClick={handleToggleMobileSearch}
                isActive={isMobileSearchOpen}
                isExpanded={isMobileSearchOpen}
                glyph={
                  <Search
                    size={18}
                    strokeWidth={isMobileSearchOpen ? 2.2 : 1.75}
                  />
                }
              />

              {/* 5. Account */}
              <NavItem
                label="Account"
                onClick={handleToggleAccountMenu}
                isActive={isAccountActive}
                isExpanded={session ? isAccountMenuOpen : undefined}
                glyph={
                  isMounted && session?.user?.image ? (
                    <span
                      className={`relative block h-[20px] w-[20px] overflow-hidden rounded-full border transition-colors ${
                        isAccountActive ? "border-white ring-1 ring-white/50" : "border-white/40"
                      }`}
                    >
                      <Image
                        src={session.user.image}
                        alt=""
                        fill
                        sizes="20px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <User size={18} strokeWidth={isAccountActive ? 2.2 : 1.75} />
                  )
                }
              />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
