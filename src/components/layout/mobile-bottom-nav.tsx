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
  const itemClasses = `relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 outline-none select-none active:scale-95 ${
    isActive ? "text-gray-950 font-bold" : "text-gray-600 hover:text-gray-950 font-semibold"
  }`;

  const content = (
    <>
      <span className="flex items-center justify-center transition-transform duration-200">
        {glyph}
      </span>
      <span className="text-[9.5px] leading-none tracking-wider uppercase mt-1 font-bold">
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
        <div className="pointer-events-auto relative mx-auto w-full max-w-md h-[56px]">
          {/* SVG Background Path (Crisp white cradle with clean soft drop shadow) */}
          <svg
            viewBox="0 0 380 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full text-white fill-current drop-shadow-[0_4px_25px_rgba(0,0,0,0.12)] filter drop-shadow-[0_0_1px_rgba(0,0,0,0.08)]"
          >
            <path d="M0 28C0 12.536 12.536 0 28 0H142C155.5 0 166.5 12 175.5 21C180.5 26 184.8 28 190 28C195.2 28 199.5 26 204.5 21C213.5 12 224.5 0 238 0H352C367.464 0 380 12.536 380 28C380 43.464 367.464 56 352 56H28C12.536 56 0 43.464 0 28Z" />
          </svg>

          {/* Floating Center Cart Button (Solid Dark Black/Charcoal) */}
          <div className="absolute -top-[22px] left-1/2 z-20 -translate-x-1/2">
            <button
              type="button"
              onClick={handleOpenCart}
              aria-label={`Open cart, ${totalCartItems} items`}
              className={`relative flex h-[44px] w-[44px] items-center justify-center rounded-full bg-gray-900 text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] ring-2 ring-white outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-gray-400 active:scale-90 ${
                isCartPopping ? "animate-cart-pop" : ""
              } ${isCartOpen ? "scale-95" : ""}`}
            >
              <ShoppingBag size={18} strokeWidth={2} className="text-white" />
              <span className="absolute -top-1 -right-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[8.5px] font-extrabold text-white border-2 border-white shadow-xs">
                {totalCartItems > 99 ? "99+" : totalCartItems}
              </span>
            </button>
          </div>

          {/* Nav Items Row (Crisp Dark Neutral Typography) */}
          <div className="relative z-10 flex h-full items-center justify-between px-2">
            {/* 1. Home */}
            <NavItem
              label="Home"
              href="/"
              isActive={isHomeActive}
              glyph={<Home size={18} strokeWidth={isHomeActive ? 2.4 : 1.9} />}
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
                  strokeWidth={isMobileMenuOpen ? 2.4 : 1.9}
                />
              }
            />

            {/* 3. Cart (Center Slot Underneath Floating Button) */}
            <button
              type="button"
              onClick={handleOpenCart}
              aria-label="Open cart"
              className="flex flex-1 flex-col items-center justify-end h-full pb-1.5 outline-none select-none text-gray-700 hover:text-gray-950 transition-colors active:scale-95"
            >
              <span className="text-[9.5px] leading-none tracking-wider uppercase font-bold text-gray-900">
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
                  strokeWidth={isMobileSearchOpen ? 2.4 : 1.9}
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
                      isAccountActive ? "border-gray-900 ring-2 ring-gray-900/30" : "border-gray-300"
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
                  <User size={18} strokeWidth={isAccountActive ? 2.4 : 1.9} />
                )
              }
            />
          </div>
        </div>
      </nav>
    </>
  );
}
