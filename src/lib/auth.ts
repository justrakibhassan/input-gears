import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite"
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  // 1. Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // 2. Social Providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // 3. Session Configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // 4. Security & Rate Limiting
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 5,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  ],
});
