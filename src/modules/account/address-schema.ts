import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().optional(),

  name: z.string().min(2, "Name is too short"),

  phone: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format"),

  street: z.string().min(5, "Street address is too short"),
  city: z.string().min(2, "City is required"),

  state: z.union([z.string(), z.null(), z.undefined(), z.literal("")]),

  zip: z.string().min(3, "Invalid ZIP code"),
  country: z.string().default("United States"),

  type: z.enum(["HOME", "WORK"]).default("HOME"),
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
