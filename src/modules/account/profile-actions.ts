"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ProfileFormValues, profileSchema } from "./profile-schema";


// 1. Get User Profile
export async function getUserProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return null;

  return await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
    },
  });
}

// 2. Update Profile
export async function updateProfile(data: ProfileFormValues) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error("Unauthorized");

  const validated = profileSchema.parse(data);

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: validated.name,
        image: validated.image,
        phone: validated.phone,
      },
    });

    revalidatePath("/account");
    return { success: true };
  } catch {
    throw new Error("Failed to update profile");
  }
}
