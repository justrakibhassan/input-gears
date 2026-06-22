import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
  images: {
    qualities: [75, 80, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://upload-widget.cloudinary.com https://widget.cloudinary.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://upload-widget.cloudinary.com; img-src 'self' https: data: blob:; font-src 'self' https:; connect-src 'self' https:; frame-src 'self' https://upload-widget.cloudinary.com https://widget.cloudinary.com https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
