import { z } from 'zod';

export const createConversationSchema = z.object({
  participantIds: z.array(z.coerce.number().int().positive()).min(1).max(49),
});

export const createDirectMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  replyToMessageId: z.coerce.number().int().positive().optional(),
});

export const directMessageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
});

export const updateDirectMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
