import MessageService, { messageService } from "../../services/message.services.js";
import ConversationService, { conversationService } from '../../services/conversation.services.js'
import ConnectionManager, { connectionManager } from '../managers/connection.manager.js'

class MessageHandler {
     constructor(
        private messageService: MessageService,
        private conversationService: ConversationService,
        private connectionManager: ConnectionManager
    ) {}

    async newMessage(
        {
            senderId,
            conversationId,
            content
        }: {
            senderId: number,
            conversationId: number,
            content: string
        }
    ): Promise<void> {
        const members = await this.conversationService.getMembers(conversationId);

        const isMember = members.some((con) => con.user_id === senderId);

        if (!isMember) {
            throw new Error("User is not a member of this conversation");
        }

        const message = await this.messageService.createMessage({
                        conversationId,
                        senderId,
                        content
                    });
           // 4. Get user IDs
        const userIds = members.map(member => member.user_id);

        this.connectionManager.broadcast(
            userIds,
            {
                type: "message.new",
                data: message
            }
        );
    }
}

export const messageHandler = new MessageHandler(messageService, conversationService, connectionManager); 