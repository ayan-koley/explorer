import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100),

  type: z.enum(["text", "voice"]),

  position: z.number().int().min(0).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["text", "voice"]).optional(),
  position: z.number().int().min(0).optional(),
});