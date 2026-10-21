import type { Socket } from 'socket.io';
import { db } from '../../prisma/db.js';
import { createChannelMessage, MessageAccessError } from '../../modules/messages/messages.service.js';
import { getChannelAccess, Permission } from '../../modules/servers/server.permissions.js';
import { createMessageSchema } from '../../validations/channel-message.validations.js';
import { connectionManager } from '../managers/connection.manager.js';

type ChannelMessagePayload = {
  channelId?: unknown;
  content?: unknown;
  replyToMessageId?: unknown;
};

const sendError = (socket: Socket, message: string) => {
  socket.emit('message:error', { message });
};

export async function handleChannelMessageEvent(
  socket: Socket,
  userId: number,
  payload: ChannelMessagePayload,
): Promise<void> {
  const channelIdIsValid =
    (typeof payload.channelId === 'number' && Number.isSafeInteger(payload.channelId) && payload.channelId > 0) ||
    (typeof payload.channelId === 'string' && /^[1-9]\d*$/.test(payload.channelId));
  if (!channelIdIsValid) return sendError(socket, 'A valid channelId is required');

  const parsed = createMessageSchema.safeParse({
    content: payload.content,
    ...(payload.replyToMessageId !== undefined ? { replyToMessageId: payload.replyToMessageId } : {}),
  });
  if (!parsed.success) return sendError(socket, parsed.error.message);

  try {
    const channelId = Number(payload.channelId);
    const message = await createChannelMessage(channelId, userId, parsed.data);
    const channel = await db.orm.public.Channel.first({ id: channelId });
    if (!channel) return;

    const members = await db.orm.public.ServerMember.select('userId').where({ serverId: channel.serverId }).all();
    const recipients = await Promise.all(members.map(async ({ userId: memberId }) => {
      const access = await getChannelAccess(channelId, memberId);
      return access?.permissions !== null && access?.permissions !== undefined &&
        (access.permissions & Permission.VIEW_CHANNEL) !== 0 ? memberId : null;
    }));

    connectionManager.broadcast(
      recipients.filter((memberId): memberId is number => memberId !== null),
      'message:new',
      message,
    );
  } catch (error) {
    sendError(socket, error instanceof MessageAccessError ? error.message : 'Unable to send message');
  }
}
