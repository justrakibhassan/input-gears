"use client";

import { useEffect } from "react";

let lockCount = 0;
let restoreOverflow = "";

/**
 * Reference-counted body scroll lock.
 *
 * The mobile overlays hand off to each other (opening search closes the nav
 * drawer, the cart drawer can sit over either), and each one setting
 * `body.style.overflow` on its own would let the closing overlay unlock the page
 * while another is still open. Counting the locks keeps the last one honest.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      restoreOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = restoreOverflow;
      }
    };
  }, [isLocked]);
}
