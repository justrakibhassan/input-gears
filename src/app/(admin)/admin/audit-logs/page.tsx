import { Suspense } from "react";
import { getAuditLogs } from "@/modules/admin/actions/audit-actions";
import { AuditLogsTable } from "@/modules/admin/components/audit-logs-table";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Audit Logs — Admin",
};

function AuditLogsLoading() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AuditLogsContent() {
  const logs = await getAuditLogs();
  return <AuditLogsTable data={logs} />;
}

export default function AuditLogsPage() {
  return (
    <div className="w-full space-y-6 pb-10">
      <Suspense fallback={<AuditLogsLoading />}>
        <AuditLogsContent />
      </Suspense>
    </div>
  );
}
