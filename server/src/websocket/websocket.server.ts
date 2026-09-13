import { WebSocketServer, WebSocket } from 'ws'
import { verifyAccessToken } from '../utils/token.js';
import { connectionManager } from './managers/connection.manager.js';
import { messageHandler } from './handlers/message.handlers.js';


type AuthUser = {
  id: number;
  username: string;
};
interface AuthenticatedWebSocket extends WebSocket {
  user?: AuthUser;
}

export function createWebSocketServer(server: any) {
    const wss = new WebSocketServer(server);

    wss.on('connection', (socket, request) => {

        const ws = socket as AuthenticatedWebSocket;
        const token = request.headers.cookie;

        if(!token) {
            ws.close();
            return;
        }

        const user = verifyAccessToken(token);

        if(!user) {
            ws.close();
            return;
        }

        ws.user = user;

        connectionManager.add(user.id, socket);

        socket.on('message', async(msg) => {
            const data = JSON.parse(msg.toString());

            switch (data.type) {
                case "message.new":
                    await messageHandler.newMessage({
                        senderId: user.id,
                        conversationId: data.conversationId,
                        content: data.content
                    })
                    break;
            }
        })

    })

    return wss;
}