import { z } from "zod";

export const createServerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  iconUrl: z
    .string()
    .url()
    .optional(),

  visibility: z
    .enum(["public", "private"])
    .default("public"),
});

export const updateServerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().max(1000).optional(),

  iconUrl: z.string().url().nullable().optional(),

  visibility: z.enum(["public", "private"]).optional(),
});

export const serverIdParamsSchema = z.object({ serverId: z.coerce.number().int().positive() });

export const roleSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default('#99AAB5'),
  permissions: z.number().int().min(0).max(511),
  position: z.number().int().min(0).max(1000).optional(),
});

export const updateRoleSchema = roleSchema.partial();
