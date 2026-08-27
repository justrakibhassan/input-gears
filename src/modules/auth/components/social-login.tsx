"use client";

import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SocialLogin() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const callbackURL = searchParams.get("callbackURL") || "/account";

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    toast.loading("Redirecting to Google...");

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: callbackURL,
      },
      {
        onError: (ctx) => {
          toast.dismiss();
          toast.error(ctx.error.message || "Failed to login with Google");
          setIsLoading(false);
        },
        onSuccess: () => {
          toast.dismiss();
          toast.success("Login successful!");
        },
      },
    );
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl text-sm text-gray-800 font-semibold shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
