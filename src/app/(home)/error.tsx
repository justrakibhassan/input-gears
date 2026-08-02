"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw, MoveLeft } from "lucide-react";

/**
 * Storefront error boundary. Catches render and data-fetching failures in the
 * (home) route group so a single broken page doesn't blank the whole site.
 */
export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only safe correlation handle — the message itself may
    // carry internals, so it never reaches the UI.
    console.error("Storefront error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-destructive/10 rounded-full blur-3xl animate-pulse" />
        <AlertTriangle className="relative w-20 h-20 text-destructive" />
      </div>

      <div className="max-w-md space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-lg">
          We hit an unexpected problem loading this page. Trying again usually
          sorts it out.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Reference: {error.digest}
          </p>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg" className="rounded-full px-8 group">
            <RotateCw className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 group"
          >
            <Link href="/">
              <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
