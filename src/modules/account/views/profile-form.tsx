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
    <div className="space-y-12 divide-y divide-gray-100">
      <GeneralInfoForm user={user} />
      <div className="pt-12">
        <PasswordChangeForm />
      </div>
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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Left Column: Description & Avatar */}
      <div className="lg:col-span-4 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            General Details
          </h3>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Update your profile photo and personal details.
          </p>
        </div>

        {/* --- Avatar Upload Widget --- */}
        <div className="flex flex-col items-center sm:items-start gap-4">
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
                    className="relative group cursor-pointer w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center shrink-0"
                  >
                    {form.watch("image") ? (
                      <Image
                        src={form.watch("image") || ""}
                        alt="Profile"
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <User size={36} className="text-gray-300" />
                    )}

                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="text-white w-5 h-5 mb-1" />
                      <span className="text-white text-[9px] font-black uppercase tracking-wider">
                        Upload
                      </span>
                    </div>
                  </div>
                );
              }}
            </CldUploadWidget>
          ) : (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
              {form.watch("image") ? (
                <Image
                  src={form.watch("image") || ""}
                  alt="Profile"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <User size={36} className="text-gray-300" />
              )}
            </div>
          )}
          
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-xs font-bold text-gray-700 tracking-tight">
              Profile Photo
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold max-w-[200px]">
              {isCloudinaryConfigured
                ? "Click on the photo to choose a new image."
                : "Cloudinary upload is not configured."}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Inputs */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                {...form.register("name")}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50/30 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="Your Name"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50/30 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="017xxxxxxxx"
              />
            </div>
            {form.formState.errors.phone && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1 mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Email (Disabled/ReadOnly) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
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
                className="w-full pl-12 pr-32 py-3 border border-gray-200 rounded-xl text-sm font-semibold bg-gray-50 text-gray-400 cursor-not-allowed select-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} /> Verified
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !form.formState.isDirty}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}

// --- SUB COMPONENT 2: Password Change ---
function PasswordChangeForm() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Left Column: Description */}
      <div className="lg:col-span-4">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          Security Settings
        </h3>
        <p className="text-xs text-gray-400 font-semibold mt-1 max-w-[280px]">
          Update your account password regularly to ensure security.
        </p>
      </div>

      {/* Right Column: Inputs */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Current Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...form.register("currentPassword")}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50/30 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.currentPassword && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1 mt-1">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                {...form.register("newPassword")}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50/30 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.newPassword && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-wider ml-1 mt-1">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            Update Password
          </button>
        </div>
      </div>
    </form>
  );
}
