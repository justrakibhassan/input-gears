"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, Settings, CheckCircle2, Headphones } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordView() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: "/reset-password",
        }),
      });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Instructions processed!");
    } catch {
      // Still show success to prevent account enumeration / reconnaissance attacks
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative z-10 animate-in fade-in zoom-in duration-500 -mt-20">
        {/* Header */}
        <div className="text-center mb-6 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-indigo-500/30 transition-colors">
              <Settings className="w-6 h-6 text-indigo-600 animate-[spin_10s_linear_infinite]" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isSubmitted ? "Check Your Inbox" : "Reset Password"}
          </h1>
          <p className="text-sm text-gray-500">
            {isSubmitted
              ? "We sent password reset instructions to your email."
              : "Enter your registered email address to reset your account password."}
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center space-y-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                If an account exists for <strong className="text-gray-900 font-semibold">{submittedEmail}</strong>, instructions to reset your password have been sent.
              </p>
            </div>

            {/* Support Info Box */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <Headphones className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900">Need immediate help?</p>
                <p>
                  If you do not receive an email or no longer have access to this inbox, please{" "}
                  <Link href="/contact" className="text-indigo-600 hover:underline font-medium">
                    contact support
                  </Link>{" "}
                  or email{" "}
                  <a href="mailto:support@inputgears.com" className="text-indigo-600 hover:underline font-medium">
                    support@inputgears.com
                  </a>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Try another email
              </button>
              <Link
                href="/sign-in"
                className="w-full py-2.5 px-4 text-xs font-semibold text-center text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Account Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Support Note */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2.5">
              <Headphones className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Having trouble accessing your account? Reach our support directly via{" "}
                <Link href="/contact" className="text-indigo-600 hover:underline font-medium">
                  Support Desk
                </Link>.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
