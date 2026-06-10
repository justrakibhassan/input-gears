"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Store,
  ShieldCheck,
  Bell,
  Save,
  CreditCard,
  Ticket,
  Truck,
  Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateMaintenanceMode, updateTaxRate } from "@/modules/admin/actions";
import CouponManager from "./coupon-manager";
import ShippingZoneManager from "./shipping-zone-manager";
import { Coupon, ShippingZone } from "@prisma/client";
import { useTheme } from "next-themes";

// Tabs Configuration
const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "payment", label: "Payment & Currency", icon: CreditCard },
  { id: "shipping", label: "Shipping", icon: Truck }, // New Tab
  { id: "coupons", label: "Coupons & Discounts", icon: Ticket },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
];

interface SettingsFormProps {
  initialData: {
    maintenanceMode: boolean;
    coupons: Coupon[];
    shippingZones: ShippingZone[];
    taxRate: number;
  };
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [activeTab, setActiveTab ] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(initialData.maintenanceMode);
  const [taxRate, setTaxRate] = useState(initialData.taxRate);
  const { theme, setTheme } = useTheme();

  const hasChanges =
    isMaintenance !== initialData.maintenanceMode ||
    taxRate !== initialData.taxRate;

  // Save Function
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const maintenancePromise = updateMaintenanceMode(isMaintenance);
      const taxPromise = updateTaxRate(Number(taxRate));
      
      const [mRes, tRes] = await Promise.all([maintenancePromise, taxPromise]);
      
      if (mRes.success && tRes.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Some settings failed to save.");
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 1. Sidebar Tabs */}
      <div className="lg:w-64 space-y-1 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 space-y-6 max-w-3xl">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">Store Details</h3>
              <p className="text-sm text-gray-500 mb-6">
                Manage your store name and contact info.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Store Name
                  </label>
                  <input
                    type="text"
                    defaultValue="InputGears"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Support Email
                    </label>
                    <input
                      type="email"
                      defaultValue="support@inputgears.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      defaultValue="+880 1XXX-XXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">Maintenance Mode</h3>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Enable Maintenance
                  </p>
                  <p className="text-xs text-gray-500">
                    Visitors will see a &quot;Coming Soon&quot; page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isMaintenance}
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === "payment" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Currency & Tax</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Store Currency
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none">
                    <option>USD ($)</option>
                    <option>BDT (৳)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Settings */}
        {activeTab === "shipping" && (
          <ShippingZoneManager initialZones={initialData.shippingZones} />
        )}

        {/* Other tabs placeholders... */}
        {activeTab === "notifications" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in">
            <h3 className="font-bold text-gray-900 mb-4">
              Email Notifications
            </h3>
            {[
              "New Order Alert",
              "Low Stock Warning",
              "New Customer Signup",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">Admin Panel Theme</h3>
              <p className="text-sm text-gray-500 mb-6">
                Choose how the admin dashboard looks.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    theme === "light"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-indigo-300 text-gray-600"
                  )}
                >
                  <div className="w-8 h-8 mx-auto mb-2 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center">
                    ☀️
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    theme === "dark"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-indigo-300 text-gray-600"
                  )}
                >
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-900 rounded-full shadow-sm flex items-center justify-center">
                    🌙
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    theme === "system"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-indigo-300 text-gray-600"
                  )}
                >
                  <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-tr from-gray-900 to-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center">
                    💻
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Management */}
        {activeTab === "coupons" && (
          <CouponManager initialCoupons={initialData.coupons} />
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="px-6 py-2.5 bg-gray-900 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
