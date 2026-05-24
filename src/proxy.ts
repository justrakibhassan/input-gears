import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Handles route protection and smart authentication redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Security Headers
  const response = NextResponse.next();

  // CORS Configuration (customize to your domain)
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  ];
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  const withHeaders = (res: NextResponse) => {
    response.headers.forEach((value, key) => {
      res.headers.set(key, value);
    });
    return res;
  };

  // ✅ Rate Limiting (API routes only)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
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
  }

  // session check using Better Auth API
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // ✅ Maintenance Mode Enforcement
  // Skip check for admin, sign-in, and the maintenance page itself
  const isMaintenanceExempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  const isAdminLike =
    session?.user?.role &&
    ["SUPER_ADMIN", "MANAGER", "CONTENT_EDITOR"].includes(
      session.user.role as string,
    );

  if (!isMaintenanceExempt && !isAdminLike) {
    try {
      interface SiteSettingsWithMaintenance {
        maintenanceMode: boolean;
      }

      const settings = (await prisma.siteSettings.findUnique({
        where: { id: "general" },
        select: { maintenanceMode: true } as Record<string, boolean>,
      })) as unknown as SiteSettingsWithMaintenance | null;

      if (settings?.maintenanceMode) {
        return withHeaders(NextResponse.rewrite(new URL("/maintenance", request.url)));
      }
    } catch (error) {
      logger.error("Maintenance mode check failed", error);
    }
  }

  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

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

  // ✅ Admin Role Enforcement
  if (pathname.startsWith("/admin") && !isAdminLike) {
    return withHeaders(NextResponse.redirect(new URL("/", request.url)));
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
