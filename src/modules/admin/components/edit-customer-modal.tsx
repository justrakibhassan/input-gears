"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Mail, Shield, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/modules/admin/actions";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["USER", "MANAGER", "CONTENT_EDITOR", "SUPER_ADMIN"]),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Phone number must contain only digits",
    }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    phone: string | null;
  };
}

export default function EditCustomerModal({
  isOpen,
  onClose,
  user,
}: EditCustomerModalProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      role: (user.role as "USER" | "MANAGER" | "CONTENT_EDITOR" | "SUPER_ADMIN") || "USER",
      phone: user.phone || "",
    },
  });

  const onSubmit = (data: UserFormValues) => {
    startTransition(async () => {
      const res = await updateUser(user.id, data);
      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-9998"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 z-9999 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="p-8 sm:p-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                      Edit Customer{" "}
                      <span className="text-indigo-600">Profile</span>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Update verification and contact details
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                          size={18}
                        />
                        <input
                          {...form.register("name")}
                          placeholder="Ex: John Doe"
                          className="w-full h-14 bg-gray-50 border-gray-100 border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none"
                        />
                      </div>
                      {form.formState.errors.name && (
                        <p className="text-[10px] text-red-500 font-bold uppercase ml-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                          size={18}
                        />
                        <input
                          {...form.register("email")}
                          placeholder="john@example.com"
                          className="w-full h-14 bg-gray-50 border-gray-100 border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none"
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-[10px] text-red-500 font-bold uppercase ml-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                          size={18}
                        />
                        <input
                          {...form.register("phone")}
                          placeholder="+880 1xxx-xxxxxx"
                          className="w-full h-14 bg-gray-50 border-gray-100 border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Account Role
                      </label>
                      <div className="relative group">
                        <Shield
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                          size={18}
                        />
                        <select
                          {...form.register("role")}
                          className="w-full h-14 bg-gray-50 border-gray-100 border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none appearance-none cursor-pointer uppercase"
                        >
                          <option value="USER">User</option>
                          <option value="MANAGER">Manager</option>
                          <option value="CONTENT_EDITOR">Content Editor</option>
                          <option value="SUPER_ADMIN">Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
