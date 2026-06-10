"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  adminId: string;
  admin: {
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: Date;
}

interface AuditLogsTableProps {
  data: AuditLog[];
}

export function AuditLogsTable({ data }: AuditLogsTableProps) {
  const getActionColor = (action: string) => {
    if (action.includes("DELETE")) return "bg-red-100 text-red-600 hover:bg-red-100";
    if (action.includes("CREATE")) return "bg-green-100 text-green-600 hover:bg-green-100";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-600 hover:bg-blue-100";
    return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800";
  };

  if (data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
        <div className="text-muted-foreground">No audit logs found.</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{log.admin.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.admin.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getActionColor(log.action)}>
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded border">
                  {log.entityType}
                </span>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm leading-relaxed">{log.details}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
