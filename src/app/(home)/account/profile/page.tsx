import { getUserProfile } from "@/modules/account/profile-actions";
import ProfileForm from "@/modules/account/views/profile-form";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile Settings | InputGears",
};

export default async function ProfilePage() {
  // 1. Fetch data on server side
  const user = await getUserProfile();

  // 2. Redirect if not logged in
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="pb-6 border-b border-gray-100 mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
          Profile <span className="text-indigo-600">Settings</span>
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Manage your public profile and account details.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
