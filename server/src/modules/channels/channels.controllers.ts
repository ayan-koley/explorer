import type { Request, Response } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/index.js';
import { db } from '../../prisma/db.js';
import { createChannelSchema, updateChannelSchema } from '../../validations/channel.valdiations.js';
import { routeIntParam } from '../../utils/routeParam.js';
import { Permission } from '../servers/server.permissions.js';

export const listChannels = asyncHandler(async (req: Request, res: Response) => {
  const access = res.locals.serverAccess as { isOwner: boolean; permissions: number | null };
  const channels = await db.orm.public.Channel.where({ serverId: routeIntParam(req, 'serverId') })
    .orderBy((channel) => channel.position.asc()).all();
  const visible = channels.filter((channel) => !channel.isPrivate || access.isOwner ||
    (access.permissions !== null && (access.permissions & Permission.MANAGE_CHANNELS) !== 0));
  return res.json(ApiResponse.success(visible));
});

export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const input = createChannelSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json(ApiResponse.error(input.error.message));
  const channel = await db.orm.public.Channel.create({
    serverId: routeIntParam(req, 'serverId'), name: input.data.name, type: input.data.type,
    position: input.data.position ?? 0, isPrivate: input.data.isPrivate ?? false,
  });
  return res.status(201).json(ApiResponse.success(channel, 'Channel created'));
});

export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
  const input = updateChannelSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json(ApiResponse.error(input.error.message));
  const channel = await db.orm.public.Channel.where({ id: routeIntParam(req, 'channelId'), serverId: routeIntParam(req, 'serverId') }).first();
  if (!channel) return res.status(404).json(ApiResponse.error('Channel not found'));
  const updated = await db.orm.public.Channel.where({ id: channel.id }).update(input.data);
  return res.json(ApiResponse.success(updated, 'Channel updated'));
});

export const deleteChannel = asyncHandler(async (req: Request, res: Response) => {
  const channel = await db.orm.public.Channel.where({ id: routeIntParam(req, 'channelId'), serverId: routeIntParam(req, 'serverId') }).first();
  if (!channel) return res.status(404).json(ApiResponse.error('Channel not found'));
  await db.transaction(async (tx) => {
    await tx.orm.public.LegacyVoiceSession.where({ channel_id: channel.id }).delete();
    await tx.orm.public.Message.where({ channelId: channel.id }).update({ replyToMessageId: null });
    await tx.orm.public.Message.where({ channelId: channel.id }).delete();
    await tx.orm.public.Channel.where({ id: channel.id }).delete();
  });
  return res.json(ApiResponse.success(null, 'Channel deleted'));
});
