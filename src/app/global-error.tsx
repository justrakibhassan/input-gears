"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches failures in the root layout itself, so it has
 * to render its own <html>/<body>. Styles are inline because the stylesheet
 * pipeline may be exactly what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: "#f9fafb",
          color: "#111827",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            backgroundColor: "#ffffff",
            border: "1px solid #f3f4f6",
            borderRadius: "24px",
            padding: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#4b5563",
            }}
          >
            Input Gears ran into an unexpected problem. Please reload the page —
            if it keeps happening, try again in a few minutes.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.6875rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#6b7280",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                cursor: "pointer",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#030712",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
              }}
            >
              Try again
            </button>
            {/* Deliberately a plain anchor, not next/link: the root layout has
                failed, so a full document reload is the recovery path. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                color: "#374151",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
