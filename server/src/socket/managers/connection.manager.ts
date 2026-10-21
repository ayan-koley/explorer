import type { Socket } from 'socket.io';

class ConnectionManager {
  private readonly connections = new Map<number, Set<Socket>>();

  add(userId: number, socket: Socket) {
    const sockets = this.connections.get(userId) ?? new Set<Socket>();
    sockets.add(socket);
    this.connections.set(userId, sockets);
  }

  remove(userId: number, socket: Socket) {
    const sockets = this.connections.get(userId);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) this.connections.delete(userId);
  }

  broadcast(userIds: number[], event: string, payload: unknown) {
    for (const userId of userIds) {
      for (const socket of this.connections.get(userId) ?? []) {
        if (socket.connected) socket.emit(event, payload);
      }
    }
  }
}

export const connectionManager = new ConnectionManager();
