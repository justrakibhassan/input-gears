"use client";

import { useEffect } from "react";

export function ThemeReset() {
  useEffect(() => {
    // Remove dark mode class when landing on the storefront
    // This is necessary because the admin uses next-themes which sets class on html
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
    }
    // Also remove the inline style added by next-themes
    html.style.colorScheme = "light";
  }, []);

  return null;
}
