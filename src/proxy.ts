import { auth } from "@/lib/auth";
import { ratelimit, authRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Handles route protection and smart authentication redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Stripe webhooks authenticate by signature, not session, and must never be
  // rate limited — a 429 makes Stripe retry, compounding the load.
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // CORS Configuration
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  ];
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  const withHeaders = (res: NextResponse) => {
    response.headers.forEach((value, key) => {
      res.headers.set(key, value);
    });
    return res;
  };

  // ✅ Rate Limiting (scoped to API routes)
  if (pathname.startsWith("/api")) {
    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const isAuthAction =
      pathname.startsWith("/api/auth/sign-in") ||
      pathname.startsWith("/api/auth/sign-up") ||
      pathname.startsWith("/api/auth/forget-password") ||
      pathname.startsWith("/api/auth/reset-password");

    if (isAuthAction) {
      try {
        const { success, limit, reset, remaining } =
          await authRatelimit.limit(identifier);

        if (!success) {
          return withHeaders(
            new NextResponse("Too many authentication attempts. Please try again later.", {
              status: 429,
              headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              },
            })
          );
        }
      } catch (error) {
        logger.error("Auth rate limiting error, falling through gracefully", error);
      }
    } else if (!pathname.startsWith("/api/auth")) {
      try {
        const { success, limit, reset, remaining } =
          await ratelimit.limit(identifier);

        if (!success) {
          return withHeaders(
            new NextResponse("Too many requests", {
              status: 429,
              headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              },
            })
          );
        }
      } catch (error) {
        logger.error("API rate limiting error, falling through gracefully", error);
      }
    }
  }

  // ✅ Route Protection & Smart Redirects
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password");
  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

  // ONLY perform session check if user is visiting auth routes or protected routes.
  // Public routes (like /, /products, /contact, etc.) bypass this completely for blazing fast TTFB.
  if (isAuthRoute || isProtectedRoute) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // If user is logged in & trying to access auth routes -> redirect to account
      if (session?.user && isAuthRoute) {
        return withHeaders(NextResponse.redirect(new URL("/account", request.url)));
      }

      // If user is NOT logged in & trying to access protected routes -> redirect to sign-in with callbackURL
      if (!session?.user && isProtectedRoute) {
        const callbackURL = encodeURIComponent(pathname);
        return withHeaders(
          NextResponse.redirect(
            new URL(`/sign-in?callbackURL=${callbackURL}`, request.url),
          )
        );
      }

      // Admin Role Enforcement
      const isAdminLike =
        session?.user?.role &&
        ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(
          session.user.role as string,
        );

      if (pathname.startsWith("/admin") && !isAdminLike) {
        return withHeaders(NextResponse.redirect(new URL("/", request.url)));
      }
    } catch (error) {
      logger.error("Proxy session check failed", error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with common extensions (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico|csv|docx?|xlsx?|zip|pdf)$).*)",
  ],
};
