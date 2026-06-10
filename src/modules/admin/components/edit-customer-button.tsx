"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import EditCustomerModal from "./edit-customer-modal";

interface EditCustomerButtonProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    phone: string | null;
  };
}

export default function EditCustomerButton({ user }: EditCustomerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-14 inline-flex items-center gap-3 bg-indigo-600 text-white px-8 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg dark:shadow-none shadow-indigo-100 active:scale-95"
      >
        <Edit2 size={18} /> Edit Profile
      </button>

      <EditCustomerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={{
          ...user,
          role: user.role || "USER",
        }}
      />
    </>
  );
}
