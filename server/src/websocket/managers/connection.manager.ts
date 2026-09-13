import WebSocket from "ws"

export default class ConnectionManager {
    private connections = new Map<number, WebSocket>();

    add(userId: number, socket: WebSocket) {
        this.connections.set(userId, socket);
    }

    remove(userId: number) {
        this.connections.delete(userId);
    }

    get(userId: number) {
        return this.connections.get(userId);
    }

    isOnline(userId: number) {
        return this.connections.has(userId);
    }

    broadcast(userId: number[], message: any) {

        const payload = JSON.stringify(message);

        for(let id of userId) {
            const socket = this.get(id);

            if(!socket) {
                continue;
            }

            if(socket.readyState === WebSocket.OPEN) {
                socket.send(payload)
            }
        }
    }
}

export const connectionManager = new ConnectionManager();