import { db } from '../../prisma/db.js';
import { Permission, getChannelAccess } from '../servers/server.permissions.js';

export class MessageAccessError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function createChannelMessage(
  channelId: number,
  userId: number,
  input: { content: string; replyToMessageId?: number },
) {
  const access = await getChannelAccess(channelId, userId);
  if (!access) throw new MessageAccessError(404, 'Channel not found');
  if (access.permissions === null || (access.permissions & Permission.VIEW_CHANNEL) === 0) {
    throw new MessageAccessError(403, 'You cannot view this channel');
  }
  if ((access.permissions & Permission.SEND_MESSAGES) === 0) {
    throw new MessageAccessError(403, 'You cannot send messages in this channel');
  }
  if (access.channel.type !== 'text') throw new MessageAccessError(400, 'Messages can only be sent to text channels');

  if (input.replyToMessageId) {
    const parent = await db.orm.public.Message.first({ id: input.replyToMessageId });
    if (!parent || parent.channelId !== channelId || parent.deletedAt !== null) {
      throw new MessageAccessError(400, 'Reply target must be an active message in this channel');
    }
  }

  return db.orm.public.Message.create({
    channelId,
    authorId: userId,
    content: input.content,
    replyToMessageId: input.replyToMessageId,
  });
}

export async function listChannelMessages(
  channelId: number,
  userId: number,
  options: { limit: number; before?: string },
) {
  const access = await getChannelAccess(channelId, userId);
  if (!access) throw new MessageAccessError(404, 'Channel not found');
  if (access.permissions === null || (access.permissions & Permission.VIEW_CHANNEL) === 0) {
    throw new MessageAccessError(403, 'You cannot view this channel');
  }
  if (access.channel.type !== 'text') throw new MessageAccessError(400, 'Messages are only available in text channels');

  let query = db.orm.public.Message
    .where({ channelId })
    .where((message) => message.deletedAt.isNull())
    .orderBy((message) => message.createdAt.desc());
  if (options.before) query = query.where((message) => message.createdAt.lt(options.before!));
  const messages = await query.limit(options.limit).all();
  return messages.reverse();
}
