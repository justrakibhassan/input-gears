"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  MoreHorizontal,
  Trash2,
  Loader2,
  User,
  Shield,
  Ban,
  CheckCircle,
  Plus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { toggleBanUser, updateUserRole } from "@/modules/admin/actions";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/alert-modal";
import ChangeRoleModal from "./change-role-modal";
import AddStaffModal from "./add-staff-modal";
import { UserRole } from "@prisma/client";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  role: UserRole;
  banned: boolean | null;
  phone: string | null;
}

interface TeamTableProps {
  staff: StaffUser[];
}

export default function TeamTable({ staff }: TeamTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Dropdown & Modal States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<StaffUser | null>(null);
  const [demotingUser, setDemotingUser] = useState<StaffUser | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Tabs & Search State
  const [activeTab, setActiveTab] = useState<"ALL" | UserRole>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side search and tab filtering
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "ALL" || member.role === activeTab;

    return matchesSearch && matchesTab;
  });

  // Count helper
  const getTabCount = (role: "ALL" | UserRole) => {
    if (role === "ALL") return staff.length;
    return staff.filter((m) => m.role === role).length;
  };

  // Demote Staff Member to USER (Regular Customer)
  const handleDemoteConfirm = () => {
    if (!demotingUser) return;
    startTransition(async () => {
      try {
        const res = await updateUserRole(demotingUser.id, "USER");
        if (res.success) {
          toast.success(`Demoted ${demotingUser.name} to regular customer role.`);
          setDemotingUser(null);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to demote staff member");
      }
    });
  };

  // Toggle Ban Status
  const handleToggleBan = (userId: string, isBanned: boolean) => {
    startTransition(async () => {
      try {
        const res = await toggleBanUser(userId, isBanned);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to change ban status");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert for demotion confirmation */}
      <AlertModal
        isOpen={demotingUser !== null}
        onClose={() => setDemotingUser(null)}
        onConfirm={handleDemoteConfirm}
        loading={isPending}
        title="Remove from Admin Team?"
        description={`Are you sure you want to remove ${demotingUser?.name || demotingUser?.email} from the admin team? This will demote their role back to a regular customer (USER) and revoke all access to this admin panel.`}
      />

      {/* Role Change Modal */}
      {changingRoleUser && (
        <ChangeRoleModal
          isOpen={changingRoleUser !== null}
          onClose={() => setChangingRoleUser(null)}
          user={{
            id: changingRoleUser.id,
            name: changingRoleUser.name,
            email: changingRoleUser.email,
            role: changingRoleUser.role,
          }}
        />
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
      />

      {/* Top action bar: Search & Add Team Member */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl pl-4 pr-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="w-full sm:w-auto h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg dark:shadow-none shadow-indigo-100 transition-all active:scale-98"
        >
          <Plus size={16} />
          Add Team Member
        </button>
      </div>

      {/* Filters tabs bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800/80 overflow-x-auto scrollbar-none gap-2">
        {([
          { label: "All Staff", value: "ALL" },
          { label: "Admins", value: "SUPER_ADMIN" },
          { label: "Managers", value: "MANAGER" },
          { label: "Editors", value: "CONTENT_EDITOR" },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "pb-3.5 px-3 text-xs font-bold transition-all relative border-b-2 border-transparent -mb-[2px]",
                isActive
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-normal",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  )}
                >
                  {getTabCount(tab.value)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400">Team Member</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400">System Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400">Joined On</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-medium">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/10 shrink-0 flex items-center justify-center">
                            {member.image ? (
                              <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <User size={16} className="text-indigo-500" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate mt-0.5">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-[10px] font-bold border",
                            member.role === "SUPER_ADMIN" &&
                              "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
                            member.role === "MANAGER" &&
                              "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
                            member.role === "CONTENT_EDITOR" &&
                              "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                          )}
                        >
                          {member.role === "SUPER_ADMIN"
                            ? "Admin"
                            : member.role === "MANAGER"
                            ? "Manager"
                            : "Editor"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        {member.banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30 animate-pulse">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(member.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`mailto:${member.email}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                            title="Email Member"
                          >
                            <Mail size={16} />
                          </a>

                          {/* Action Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdownId(
                                  activeDropdownId === member.id ? null : member.id
                                )
                              }
                              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                              title="Actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {activeDropdownId === member.id && (
                              <>
                                {/* Backdrop to close dropdown */}
                                <div
                                  className="fixed inset-0 z-40 bg-transparent"
                                  onClick={() => setActiveDropdownId(null)}
                                />

                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  <button
                                    onClick={() => {
                                      setChangingRoleUser(member);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                                  >
                                    <Shield size={14} className="text-gray-400" />
                                    Change Role
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleToggleBan(member.id, !member.banned);
                                      setActiveDropdownId(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors",
                                      member.banned
                                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                        : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    )}
                                  >
                                    {member.banned ? (
                                      <>
                                        <CheckCircle size={14} />
                                        Unban Member
                                      </>
                                    ) : (
                                      <>
                                        <Ban size={14} />
                                        Ban Member
                                      </>
                                    )}
                                  </button>

                                  <div className="border-t border-gray-50 dark:border-gray-800 my-1" />

                                  <button
                                    onClick={() => {
                                      setDemotingUser(member);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                                  >
                                    <UserMinus size={14} />
                                    Demote to Customer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
