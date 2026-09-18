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