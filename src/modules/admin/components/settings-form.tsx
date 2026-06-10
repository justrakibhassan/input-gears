"use client";

import React, { useState } from "react";
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
import { useAdminTheme } from "@/store/use-admin-theme";

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
  const { 
    sidebarColor, setSidebarColor, 
    accentColor, setAccentColor, 
    compactSidebar, setCompactSidebar,
    saveTheme, revertTheme,
    resetTheme 
  } = useAdminTheme();

  // Settings global changes
  const hasChanges =
    isMaintenance !== initialData.maintenanceMode ||
    taxRate !== initialData.taxRate;

  // Track initial theme from next-themes
  const [savedAppearance, setSavedAppearance] = useState<{
    theme?: string;
  }>({});

  React.useEffect(() => {
    setSavedAppearance({ theme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use global useAdminTheme for tracking active vs saved states
  const { savedSidebarColor, savedAccentColor, savedCompactSidebar } = useAdminTheme();

  // Appearance specific changes (Draft vs Saved)
  const hasAppearanceChanges =
    theme !== savedAppearance.theme ||
    sidebarColor !== savedSidebarColor ||
    accentColor !== savedAccentColor ||
    compactSidebar !== savedCompactSidebar;

  const handleSaveAppearance = () => {
    // Save to global state (Zustand / next-themes)
    saveTheme(); // this commits the draft in Zustand to the saved fields
    setSavedAppearance({ theme }); // this commits next-themes

    toast.success("Appearance settings saved!");
  };

  // Revert draft changes when navigating away without saving
  React.useEffect(() => {
    return () => {
      // Revert Zustand state on unmount.
      // (If it was saved, revertTheme is a no-op because draft == saved)
      revertTheme();
    };
  }, [revertTheme]);

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
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-none border border-indigo-100 dark:border-indigo-800"
                : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Store Details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Manage your store name and contact info.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Store Name
                  </label>
                  <input
                    type="text"
                    defaultValue="InputGears"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      Support Email
                    </label>
                    <input
                      type="email"
                      defaultValue="support@inputgears.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      defaultValue="+880 1XXX-XXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Maintenance Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Customize the look and feel of your admin panel.
              </p>
            </div>

            {/* Sidebar Color */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none relative overflow-hidden">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Sidebar color</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Choose a background color for the left navigation sidebar.
              </p>
              
              <div className="flex items-center gap-12">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {["#1a1a2e", "#282a36", "#111827", "#1e293b", "#0f172a", "#18181b", "#7f1d1d"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSidebarColor(c)}
                        className={cn(
                          "w-10 h-10 rounded-full transition-all border-2",
                          sidebarColor === c ? "border-indigo-500 scale-110 shadow-md dark:shadow-none" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <button className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-colors">
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">{sidebarColor} selected</p>
                </div>

                {/* Sidebar Preview illustration */}
                <div className="hidden sm:flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl p-2 w-32 h-24 border border-gray-200 dark:border-gray-700 relative ml-auto">
                   <div 
                     className="absolute left-0 top-0 bottom-0 w-8 rounded-l-xl opacity-90"
                     style={{ backgroundColor: sidebarColor }}
                   >
                     <div className="mt-4 space-y-1.5 px-1.5">
                       <div className="h-1.5 bg-white dark:bg-gray-900/30 rounded-full w-full"></div>
                       <div className="h-1.5 bg-white dark:bg-gray-900/30 rounded-full w-4/5"></div>
                       <div className="h-1.5 bg-white dark:bg-gray-900/30 rounded-full w-full"></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Accent color</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Used for active nav items, buttons, and highlights.
              </p>
              
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccentColor(c)}
                      className={cn(
                        "w-10 h-10 rounded-xl transition-all border-2",
                        accentColor === c ? "border-gray-900 dark:border-white scale-110 shadow-md dark:shadow-none" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <button className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-colors">
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400">{accentColor} selected</p>
              </div>
            </div>

            {/* Compact Sidebar */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Compact sidebar</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show icons only, hide label text in the sidebar by default.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={compactSidebar}
                  onChange={(e) => setCompactSidebar(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  resetTheme();
                  setTheme("system");
                  toast.success("Appearance settings reset to default");
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-bold text-sm"
              >
                Reset to defaults
              </button>
              <button
                onClick={() => {
                  handleSaveAppearance();
                  saveTheme();
                }}
                disabled={!hasAppearanceChanges}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all shadow-md dark:shadow-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} /> Save changes
              </button>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === "payment" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Currency & Tax</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Store Currency
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 outline-none">
                    <option>USD ($)</option>
                    <option>BDT (৳)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 outline-none"
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

        {/* Notifications Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Email Notifications</h3>
              {[
                { title: "New Order Alert", desc: "Get notified when a new order is placed." },
                { title: "Low Stock Warning", desc: "Get notified when a product is running low on stock." },
                { title: "New Customer Signup", desc: "Get notified when a new customer signs up." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">{item.title}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">{item.desc}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupons Management */}
        {activeTab === "coupons" && (
          <CouponManager initialCoupons={initialData.coupons} />
        )}

        {/* Save Button for Non-Appearance Tabs */}
        {activeTab !== "appearance" && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="px-6 py-2.5 bg-gray-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg dark:shadow-none shadow-gray-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
        )}
      </div>
    </div>
  );
}
