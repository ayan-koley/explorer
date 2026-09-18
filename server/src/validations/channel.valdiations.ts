import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100),

  type: z.enum(["TEXT", "VOICE"]),

  position: z.number().int().min(0).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});