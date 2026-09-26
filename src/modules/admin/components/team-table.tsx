"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  MoreHorizontal,
  User,
  Shield,
  Ban,
  CheckCircle,
  Plus,
  UserMinus,
  Users,
  UserCheck,
  Edit3,
  Search,
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

  // Stats calculation
  const totalStaff = staff.length;
  const admins = staff.filter((s) => s.role === "SUPER_ADMIN").length;
  const managers = staff.filter((s) => s.role === "MANAGER").length;
  const editors = staff.filter((s) => s.role === "CONTENT_EDITOR").length;

  // Client-side search and tab filtering
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "ALL" || member.role === activeTab;

    return matchesSearch && matchesTab;
  });

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

  const TABS = [
    { label: "All Staff", value: "ALL" as const, count: totalStaff },
    { label: "Admins", value: "SUPER_ADMIN" as const, count: admins },
    { label: "Managers", value: "MANAGER" as const, count: managers },
    { label: "Editors", value: "CONTENT_EDITOR" as const, count: editors },
  ];

  return (
    <div className="space-y-6 w-full">
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

      {/* 1. Page Header with Title on Left & Summary Badges on Right (with icons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Team Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage administrator permissions, staff roles, and access controls
            </p>
          </div>
        </div>

        {/* Right Side: Total Staff, Admins, Managers, Editors Badges & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-2xs text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <span className="text-gray-400 font-medium">Total:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {totalStaff}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 rounded-xl shadow-2xs text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Shield size={14} className="text-rose-500" />
            <span className="text-rose-600 dark:text-rose-400 font-medium">Admins:</span>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              {admins}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl shadow-2xs text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <UserCheck size={14} className="text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">Managers:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {managers}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl shadow-2xs text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Edit3 size={14} className="text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Editors:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {editors}
            </span>
          </div>

          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isActive
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Actionable Staff Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">System Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined On</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No team members found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try searching with a different name or role filter.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 shrink-0 flex items-center justify-center">
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
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                            member.role === "SUPER_ADMIN" &&
                              "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40",
                            member.role === "MANAGER" &&
                              "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
                            member.role === "CONTENT_EDITOR" &&
                              "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40"
                          )}
                        >
                          {member.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : member.role === "MANAGER"
                            ? "Manager"
                            : "Content Editor"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {member.banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(member.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`mailto:${member.email}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                            title="Email Member"
                          >
                            <Mail size={15} />
                          </a>

                          {/* Action Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdownId(
                                  activeDropdownId === member.id ? null : member.id
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                              title="Actions"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {activeDropdownId === member.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40 bg-transparent"
                                  onClick={() => setActiveDropdownId(null)}
                                />

                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  <button
                                    onClick={() => {
                                      setChangingRoleUser(member);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Shield size={13} className="text-gray-400" />
                                    <span>Change Role</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleToggleBan(member.id, !member.banned);
                                      setActiveDropdownId(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer",
                                      member.banned
                                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                        : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    )}
                                  >
                                    {member.banned ? (
                                      <>
                                        <CheckCircle size={13} />
                                        <span>Unban Member</span>
                                      </>
                                    ) : (
                                      <>
                                        <Ban size={13} />
                                        <span>Ban Member</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                                  <button
                                    onClick={() => {
                                      setDemotingUser(member);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <UserMinus size={13} />
                                    <span>Demote to Customer</span>
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
