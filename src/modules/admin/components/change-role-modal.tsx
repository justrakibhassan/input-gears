"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { updateUserRole } from "@/modules/admin/actions";
import { UserRole } from "@prisma/client";

const roleSchema = z.object({
  role: z.enum(["USER", "MANAGER", "CONTENT_EDITOR", "SUPER_ADMIN"]),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
  };
}

export default function ChangeRoleModal({
  isOpen,
  onClose,
  user,
}: ChangeRoleModalProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: user.role,
    },
  });

  const onSubmit = (data: RoleFormValues) => {
    startTransition(async () => {
      try {
        const res = await updateUserRole(user.id, data.role);
        if (res.success) {
          toast.success(res.message);
          onClose();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to update user role");
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
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto border border-gray-100 dark:border-gray-800"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                      Change Role
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Update system permissions for {user.name || user.email}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Role Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 ml-1">
                      Select Role
                    </label>
                    <div className="relative group">
                      <Shield
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                        size={18}
                      />
                      <select
                        {...form.register("role")}
                        className="w-full h-14 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none appearance-none cursor-pointer text-gray-900 dark:text-white"
                      >
                        <option value="USER">User (Regular customer)</option>
                        <option value="MANAGER">Manager (Product/Order Manager)</option>
                        <option value="CONTENT_EDITOR">Content Editor (Catalog Editor)</option>
                        <option value="SUPER_ADMIN">Super Administrator (Full Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 h-12 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg dark:shadow-none shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Save Role
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
