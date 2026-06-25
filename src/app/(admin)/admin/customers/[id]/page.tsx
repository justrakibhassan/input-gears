import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CustomerDetailsClient from "@/modules/admin/components/customer-details-client";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) notFound();

  return <CustomerDetailsClient user={user} />;
}
