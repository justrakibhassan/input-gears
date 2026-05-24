"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Save,
  Lock,
  Smartphone,
  Mail,
  ShieldCheck,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

// Imports
import { updateProfile } from "@/modules/account/profile-actions";
import {
  profileSchema,
  ProfileFormValues,
  passwordSchema,
  PasswordFormValues,
} from "@/modules/account/profile-schema";
import { authClient } from "@/lib/auth-client";
import { CloudinaryResult } from "@/types/cloudinary";

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      <GeneralInfoForm user={user} />
      <PasswordChangeForm />
    </div>
  );
}

// --- SUB COMPONENT 1: General Info ---
function GeneralInfoForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/g, "");
  const isCloudinaryConfigured = !!cloudName && !!uploadPreset;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      image: user.image || "",
      phone: user.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      toast.success("Profile updated successfully!");
      router.refresh();
      form.reset(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">
            General Information
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            Update your photo and personal details.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 md:space-y-8"
        >
          {/* --- Avatar Section --- */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 border-dashed">
            {isCloudinaryConfigured ? (
              <CldUploadWidget
                uploadPreset={uploadPreset}
                onSuccess={(result: unknown) => {
                  if (
                    result &&
                    typeof result === "object" &&
                    "info" in result &&
                    typeof result.info === "object" &&
                    result.info !== null &&
                    "secure_url" in result.info
                  ) {
                    const info = result.info as CloudinaryResult["info"];
                    form.setValue("image", info.secure_url, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    toast.success("Image uploaded!");
                  }
                }}
                options={{
                  maxFiles: 1,
                  resourceType: "image",
                  clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
                  sources: ["local", "camera", "url"],
                }}
              >
                {({ open }) => {
                  function handleOnClick(e: React.MouseEvent) {
                    e.preventDefault();
                    open();
                  }

                  return (
                    <div
                      onClick={handleOnClick}
                      className="relative group cursor-pointer shrink-0"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100 relative z-0 ring-1 ring-gray-100">
                        {form.watch("image") ? (
                          <Image
                            src={form.watch("image") || ""}
                            alt="Profile"
                            fill
                            sizes="112px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                            <User size={40} className="sm:size-[48px]" />
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <Camera className="text-white w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">
                          Update
                        </span>
                      </div>
                    </div>
                  );
                }}
              </CldUploadWidget>
            ) : (
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100 relative z-0 ring-1 ring-gray-100">
                  {form.watch("image") ? (
                    <Image
                      src={form.watch("image") || ""}
                      alt="Profile"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <User size={40} className="sm:size-[48px]" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center sm:text-left space-y-2">
              <h4 className="text-base font-black text-gray-900 tracking-tight">
                Profile Photo
              </h4>
              <p className="text-xs text-gray-500 font-medium max-w-[200px]">
                {isCloudinaryConfigured
                  ? "Tap the image to change your profile picture."
                  : "Cloudinary upload is unconfigured."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  {...form.register("name")}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  placeholder="Your Name"
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Smartphone size={18} />
                </div>
                <input
                  {...form.register("phone")}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/\D/g, "");
                  }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  placeholder="017xxxxxxxx"
                />
              </div>
              {form.formState.errors.phone && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-gray-400 text-sm font-bold cursor-not-allowed select-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Verified
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !form.formState.isDirty}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB COMPONENT 2: Password Change ---
function PasswordChangeForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully");
      form.reset();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">
            Security
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            Update your account password.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Current Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...form.register("currentPassword")}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.currentPassword && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                New Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...form.register("newPassword")}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  placeholder="Minimum 8 characters"
                />
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 border-2 border-gray-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
