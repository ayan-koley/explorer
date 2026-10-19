import type { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/index.js';
import { db } from '../../prisma/db.js';
import { createMessageSchema, updateMessageSchema, messageListQuerySchema } from '../../validations/channel-message.validations.js';
import { Permission, getChannelAccess } from '../servers/server.permissions.js';
import { createChannelMessage, listChannelMessages, MessageAccessError } from './messages.service.js';
import { routeIntParam } from '../../utils/routeParam.js';

const sendError = (res: Response, error: unknown) => {
  if (error instanceof MessageAccessError) return res.status(error.status).json(ApiResponse.error(error.message));
  throw error;
};

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = messageListQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const messages = await listChannelMessages(routeIntParam(req, 'channelId'), req.authUser.id, parsed.data);
    return res.json(ApiResponse.success(messages));
  } catch (error) { return sendError(res, error); }
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const message = await createChannelMessage(routeIntParam(req, 'channelId'), req.authUser.id, parsed.data);
    return res.status(201).json(ApiResponse.success(message, 'Message sent'));
  } catch (error) { return sendError(res, error); }
});

async function authorizeMessageChange(messageId: number, userId: number) {
  const message = await db.orm.public.Message.first({ id: messageId });
  if (!message) return { error: 'missing' as const };
  const access = await getChannelAccess(message.channelId, userId);
  if (!access || access.permissions === null || (access.permissions & Permission.VIEW_CHANNEL) === 0) return { error: 'forbidden' as const };
  const isAuthor = message.authorId === userId;
  const canManage = (access.permissions & Permission.MANAGE_MESSAGES) !== 0;
  return { message, allowed: isAuthor || canManage };
}

export const editMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = updateMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  const access = await authorizeMessageChange(routeIntParam(req, 'messageId'), req.authUser.id);
  if (access.error === 'missing') return res.status(404).json(ApiResponse.error('Message not found'));
  if (access.error === 'forbidden' || !access.allowed) return res.status(403).json(ApiResponse.error('You cannot edit this message'));
  if (access.message.deletedAt !== null) return res.status(409).json(ApiResponse.error('Deleted messages cannot be edited'));
  const message = await db.orm.public.Message.where({ id: access.message.id }).update({ content: parsed.data.content, editedAt: new Date().toISOString() });
  return res.json(ApiResponse.success(message, 'Message updated'));
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const access = await authorizeMessageChange(routeIntParam(req, 'messageId'), req.authUser.id);
  if (access.error === 'missing') return res.status(404).json(ApiResponse.error('Message not found'));
  if (access.error === 'forbidden' || !access.allowed) return res.status(403).json(ApiResponse.error('You cannot delete this message'));
  if (access.message.deletedAt !== null) return res.status(409).json(ApiResponse.error('Message is already deleted'));
  const message = await db.orm.public.Message.where({ id: access.message.id }).update({
    content: '', deletedAt: new Date().toISOString(),
  });
  return res.json(ApiResponse.success(message, 'Message deleted'));
});
