import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminThemeState {
  sidebarColor: string;
  accentColor: string;
  compactSidebar: boolean;
  
  savedSidebarColor: string;
  savedAccentColor: string;
  savedCompactSidebar: boolean;

  setSidebarColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setCompactSidebar: (compact: boolean) => void;
  
  saveTheme: () => void;
  revertTheme: () => void;
  resetTheme: () => void;
}

const DEFAULT_STATE = {
  sidebarColor: "#111827",
  accentColor: "#4f46e5",
  compactSidebar: false,
  savedSidebarColor: "#111827",
  savedAccentColor: "#4f46e5",
  savedCompactSidebar: false,
};

export const useAdminTheme = create<AdminThemeState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setSidebarColor: (color) => set({ sidebarColor: color }),
      setAccentColor: (color) => set({ accentColor: color }),
      setCompactSidebar: (compact) => set({ compactSidebar: compact }),
      
      saveTheme: () => set((state) => ({
        savedSidebarColor: state.sidebarColor,
        savedAccentColor: state.accentColor,
        savedCompactSidebar: state.compactSidebar,
      })),

      revertTheme: () => set((state) => ({
        sidebarColor: state.savedSidebarColor,
        accentColor: state.savedAccentColor,
        compactSidebar: state.savedCompactSidebar,
      })),

      resetTheme: () => set(DEFAULT_STATE),
    }),
    {
      name: "admin-theme-storage",
      partialize: (state) => ({
        savedSidebarColor: state.savedSidebarColor,
        savedAccentColor: state.savedAccentColor,
        savedCompactSidebar: state.savedCompactSidebar,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sidebarColor = state.savedSidebarColor;
          state.accentColor = state.savedAccentColor;
          state.compactSidebar = state.savedCompactSidebar;
        }
      },
    }
  )
);
