import { create } from "zustand";

interface MobileNavStore {
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;

  isMobileSearchOpen: boolean;
  openMobileSearch: () => void;
  closeMobileSearch: () => void;
  toggleMobileSearch: () => void;
  setIsMobileSearchOpen: (isOpen: boolean) => void;
}

export const useMobileNav = create<MobileNavStore>((set) => ({
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true, isMobileSearchOpen: false }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen, isMobileSearchOpen: false })),
  setIsMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

  isMobileSearchOpen: false,
  openMobileSearch: () => set({ isMobileSearchOpen: true, isMobileMenuOpen: false }),
  closeMobileSearch: () => set({ isMobileSearchOpen: false }),
  toggleMobileSearch: () => set((state) => ({ isMobileSearchOpen: !state.isMobileSearchOpen, isMobileMenuOpen: false })),
  setIsMobileSearchOpen: (isOpen) => set({ isMobileSearchOpen: isOpen }),
}));
