import { z } from 'zod';

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(4000),
  replyToMessageId: z.coerce.number().int().positive().optional(),
});

export const updateMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(4000),
});

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
});
