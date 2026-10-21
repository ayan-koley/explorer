import { Server } from 'socket.io';
import type { ServerOptions, Socket } from 'socket.io';
import { authenticateSocket, type AuthUser } from './socket.auth.js';
import { handleChannelMessageEvent } from './events/channel-message.event.js';
import { connectionManager } from './managers/connection.manager.js';

type ChannelMessagePayload = {
  channelId?: unknown;
  content?: unknown;
  replyToMessageId?: unknown;
};

export function createSocketServer(port: number, options: Partial<ServerOptions> = {}) {
  const io = new Server(port, {
    cors: { origin: 'http://localhost:5173', credentials: true },
    perMessageDeflate: false,
    ...options,
  });

  io.use(authenticateSocket);
  io.on('connection', (socket: Socket) => {
    const user = (socket.data as { user?: AuthUser }).user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    connectionManager.add(user.id, socket);
    socket.on('message:send', async (payload: ChannelMessagePayload) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        socket.emit('message:error', { message: 'Invalid message payload' });
        return;
      }
      await handleChannelMessageEvent(socket, user.id, payload);
    });

    socket.on('disconnect', () => connectionManager.remove(user.id, socket));
  });

  return io;
}
