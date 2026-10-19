import type { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/index.js';
import { routeIntParam } from '../../utils/routeParam.js';
import {
  createConversationSchema,
  createDirectMessageSchema,
  directMessageListQuerySchema,
  updateDirectMessageSchema,
} from '../../validations/direct-message.validations.js';
import {
  createConversation,
  createDirectMessage,
  deleteDirectMessage,
  DirectMessageAccessError,
  listConversations,
  listDirectMessages,
  markConversationRead,
  updateDirectMessage,
} from './direct-messages.service.js';

const handle = (res: Response, error: unknown) => {
  if (error instanceof DirectMessageAccessError) {
    return res.status(error.status).json(ApiResponse.error(error.message));
  }
  throw error;
};

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  return res.json(ApiResponse.success(await listConversations(req.authUser.id)));
});

export const postConversation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const conversation = await createConversation(req.authUser.id, parsed.data.participantIds);
    return res.status(201).json(ApiResponse.success(conversation, 'Conversation created'));
  } catch (error) { return handle(res, error); }
});

export const getDirectMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = directMessageListQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const messages = await listDirectMessages(routeIntParam(req, 'conversationId'), req.authUser.id, parsed.data);
    return res.json(ApiResponse.success(messages));
  } catch (error) { return handle(res, error); }
});

export const postDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = createDirectMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const message = await createDirectMessage(routeIntParam(req, 'conversationId'), req.authUser.id, parsed.data);
    return res.status(201).json(ApiResponse.success(message, 'Message sent'));
  } catch (error) { return handle(res, error); }
});

export const patchDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  const parsed = updateDirectMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(ApiResponse.error(parsed.error.message));
  try {
    const message = await updateDirectMessage(routeIntParam(req, 'messageId'), req.authUser.id, parsed.data.content);
    return res.json(ApiResponse.success(message, 'Message updated'));
  } catch (error) { return handle(res, error); }
});

export const removeDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  try {
    const message = await deleteDirectMessage(routeIntParam(req, 'messageId'), req.authUser.id);
    return res.json(ApiResponse.success(message, 'Message deleted'));
  } catch (error) { return handle(res, error); }
});

export const readDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
  try {
    const receipt = await markConversationRead(
      routeIntParam(req, 'conversationId'), req.authUser.id, routeIntParam(req, 'messageId'),
    );
    return res.json(ApiResponse.success(receipt, 'Conversation marked as read'));
  } catch (error) { return handle(res, error); }
});
