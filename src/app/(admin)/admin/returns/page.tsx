import ReturnsManager from "@/modules/admin/components/returns-manager";

export const metadata = {
  title: "Returns & Refunds — Admin",
};

export default function AdminReturnsPage() {
  return (
    <div className="w-full space-y-6 pb-10">
      <ReturnsManager />
    </div>
  );
}
