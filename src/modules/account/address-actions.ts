"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AddressFormValues, addressSchema } from "./address-schema";
import { z } from "zod";

const idSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);

// --- Actions ---

// 1. Get Addresses
export async function getUserAddresses() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return [];

  return await prisma.address.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { isDefault: "desc" },
  });
}

// 2. Save (Create or Update)
export async function saveAddress(data: AddressFormValues) {
  const validated = addressSchema.parse(data);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) throw new Error("User not found");

  if (validated.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const count = await prisma.address.count({ where: { userId: user.id } });
  const shouldBeDefault = count === 0 ? true : validated.isDefault;

  if (validated.id) {
    await prisma.address.update({
      where: { id: validated.id, userId: user.id },
      data: { ...validated, isDefault: shouldBeDefault },
    });
  } else {
    await prisma.address.create({
      data: { ...validated, userId: user.id, isDefault: shouldBeDefault },
    });
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

// 3. Delete
export async function deleteAddress(id: string) {
  const validatedId = idSchema.parse(id);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) throw new Error("Unauthorized");

  const result = await prisma.address.deleteMany({
    where: { id: validatedId, userId: user.id },
  });

  if (result.count === 0) throw new Error("Not found");

  revalidatePath("/account/addresses");
  return { success: true };
}

// 4. Set Default
export async function setDefaultAddress(id: string) {
  const validatedId = idSchema.parse(id);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: validatedId, userId: user.id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses");
  return { success: true };
}
