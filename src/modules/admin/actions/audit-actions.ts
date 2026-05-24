"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  details,
}: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}) {
  try {
    // ✅ SECURITY FIX: Redact sensitive information from details
    const redactedDetails = redactSensitiveDetails(details);

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: redactedDetails, // Store only non-sensitive info
      },
    });

    // Log to external service if available
    logger.info(`Audit: ${action} on ${entityType}`, {
      adminId,
      entityId,
      action,
    });
  } catch (error) {
    logger.error("Failed to create audit log:", error, {
      adminId,
      action,
    });
    // We don't throw here to avoid breaking the main action if logging fails
  }
}

/**
 * Redact sensitive information from audit details
 */
function redactSensitiveDetails(details: string): string {
  return details
    .replace(/price\s*[:\s]\s*\$?[\d.]+/gi, "price: [REDACTED]")
    .replace(/\$[\d.]+/g, "$[AMOUNT]")
    .replace(/email[:\s]+[^\s,]+@[^\s,]+/gi, "email: [REDACTED]")
    .replace(/phone[:\s]+[\d-\s+]+/gi, "phone: [REDACTED]")
    .replace(/ssn[:\s]+[\d-]+/gi, "ssn: [REDACTED]")
    .replace(/password[:\s]+\S+/gi, "password: [REDACTED]")
    .replace(/token[:\s]+\S+/gi, "token: [REDACTED]");
}

export async function getAuditLogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ✅ SECURITY FIX: Restrict audit log access to admins only
  if (
    !session ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER")
  ) {
    logger.warn("Unauthorized audit log access attempt", {
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });
    throw new Error("Unauthorized");
  }

  try {
    return await prisma.auditLog.findMany({
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch audit logs:", error);
    throw new Error("Failed to fetch audit logs");
  }
}
