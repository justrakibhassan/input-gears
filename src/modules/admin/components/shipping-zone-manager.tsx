"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Truck } from "lucide-react";
import { toast } from "sonner";
import { upsertShippingZone, deleteShippingZone } from "@/modules/admin/actions";
import { ShippingZone } from "@prisma/client";

interface ShippingZoneManagerProps {
  initialZones: ShippingZone[];
}

export default function ShippingZoneManager({ initialZones }: ShippingZoneManagerProps) {
  const zones = initialZones;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", charge: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpsert = async () => {
    if (!formData.name) {
      toast.error("Please enter a zone name");
      return;
    }

    setIsLoading(true);
    try {
      const res = await upsertShippingZone({
        id: editingId || undefined,
        name: formData.name,
        charge: Number(formData.charge),
      });

      if (res.success) {
        toast.success("Shipping zone saved!");
        // Note: In a real app, we'd probably revalidate or refresh the page
        // For simplicity in this demo, we can just reload or the user can refresh
        window.location.reload();
      } else {
        toast.error(res.message || "Failed to save zone");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;

    try {
      const res = await deleteShippingZone(id);
      if (res.success) {
        toast.success("Zone deleted");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to delete zone");
    }
  };

  const startEdit = (zone: ShippingZone) => {
    setEditingId(zone.id);
    setFormData({ name: zone.name, charge: zone.charge });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: "", charge: 0 });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900">Shipping Zones</h3>
          <p className="text-xs text-gray-500">Define region-based shipping charges.</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} /> Add Zone
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(isAdding || editingId) && (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Zone Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inside Dhaka"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Charge (৳)</label>
                <input
                  type="number"
                  value={formData.charge}
                  onChange={(e) => setFormData({ ...formData, charge: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleUpsert}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Saving..." : <><Check size={16} /> Save Zone</>}
              </button>
            </div>
          </div>
        )}

        {zones.length === 0 && !isAdding && (
          <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
            <Truck className="mx-auto text-gray-200 mb-2" size={32} />
            <p className="text-sm text-gray-400 font-medium">No shipping zones defined yet.</p>
          </div>
        )}

        {zones.map((zone) => (
          editingId !== zone.id && (
            <div
              key={zone.id}
              className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Truck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{zone.name}</h4>
                  <p className="text-xs text-gray-500">Charge: ৳{zone.charge}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(zone)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
