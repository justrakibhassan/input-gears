import SettingsForm from "@/modules/admin/components/settings-form";
import { getSettingsPageData } from "@/modules/admin/actions";

export default async function SettingsPage() {
  const initialData = await getSettingsPageData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Control store configuration and preferences.
        </p>
      </div>

      {/* Main Settings Component */}
      <SettingsForm initialData={initialData} />
    </div>
  );
}
