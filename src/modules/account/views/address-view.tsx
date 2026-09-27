"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle2,
  Home,
  Briefcase,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  saveAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/modules/account/address-actions";
import { AddressFormValues, addressSchema } from "../address-schema";

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  zip: string;
  country?: string | null;
  type: string;
  isDefault: boolean;
}

export default function AddressView({ addresses }: { addresses: Address[] }) {
  const [isModalOpen, setModalOpen] = useState(false);

  const [editingAddress, setEditingAddress] =
    useState<AddressFormValues | null>(null);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  // --- Handlers ---
  const openFormModal = (address?: Address) => {
    if (address) {
      setEditingAddress({
        id: address.id,
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        zip: address.zip,
        country: address.country || "United States",
        isDefault: address.isDefault,
        state: address.state ?? "",
        type: (address.type as "HOME" | "WORK") || "HOME",
      });
    } else {
      setEditingAddress(null);
    }
    setModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setAddressToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      await deleteAddress(addressToDelete);
      toast.success("Address deleted successfully");
      setDeleteModalOpen(false);
      setAddressToDelete(null);
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    toast.promise(setDefaultAddress(id), {
      loading: "Updating default address...",
      success: "Default address updated!",
      error: "Failed to update",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
            <p className="text-sm text-gray-500">
              Manage your shipping and billing locations.
            </p>
          </div>
          <button
            onClick={() => openFormModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-all shadow-md"
          >
            <Plus size={18} /> Add New Address
          </button>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => openFormModal(address)}
                onDelete={() => openDeleteModal(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
              />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                No Addresses Saved
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Add an address to speed up your checkout process.
              </p>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {isModalOpen && (
          <AddressModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            initialData={editingAddress}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all duration-200 group ${
        address.isDefault
          ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50"
          : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
              address.type === "HOME"
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {address.type === "HOME" ? (
              <Home size={12} />
            ) : (
              <Briefcase size={12} />
            )}
            {address.type}
          </span>
          {address.isDefault && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 size={12} /> Default
            </span>
          )}
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-gray-900">{address.name}</h3>
        <p className="text-sm text-gray-600 font-medium">{address.phone}</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {address.street}, {address.city} {address.zip}
          <br />
          {address.state && (
            <span className="text-xs text-gray-400">{address.state}, </span>
          )}{" "}
          {address.country || "United States"}
        </p>
      </div>

      {!address.isDefault && (
        <button
          onClick={onSetDefault}
          className="mt-5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
        >
          Set as default address
        </button>
      )}
    </div>
  );
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: AddressFormValues | null;
}

function AddressModal({ isOpen, onClose, initialData }: AddressModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
      type: "HOME",
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    setLoading(true);
    try {
      await saveAddress({ ...data, id: initialData?.id });
      toast.success(
        initialData ? "Address updated!" : "Address added successfully!"
      );
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900">
            {initialData ? "Edit Address" : "Add New Address"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Name & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Full Name
              </label>
              <input
                {...form.register("name")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                placeholder="Mr. John Doe"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs ml-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Phone
              </label>
              <input
                {...form.register("phone")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                placeholder="+1 (555) 234-5678"
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-xs ml-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Address Info */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
              Street Address
            </label>
            <textarea
              {...form.register("street")}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none resize-none h-20"
              placeholder="123 Market St, Apt 4B"
            />
            {form.formState.errors.street && (
              <p className="text-red-500 text-xs ml-1">
                {form.formState.errors.street.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                City
              </label>
              <input
                {...form.register("city")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                placeholder="San Francisco"
              />
              {form.formState.errors.city && (
                <p className="text-red-500 text-xs ml-1">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                State/Area
              </label>
              <input
                {...form.register("state")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                placeholder="CA"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                ZIP Code
              </label>
              <input
                {...form.register("zip")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                placeholder="94103"
              />
              {form.formState.errors.zip && (
                <p className="text-red-500 text-xs ml-1">
                  {form.formState.errors.zip.message}
                </p>
              )}
            </div>
          </div>

          {/* Type & Default Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="HOME"
                  {...form.register("type")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Home</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="WORK"
                  {...form.register("type")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Work</span>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("isDefault")}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Make Default
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200 scale-100">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Delete Address?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to remove this address? This action cannot be
          undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition shadow-lg shadow-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
