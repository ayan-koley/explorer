import { db } from "../prisma/db.js";
import { messageValidation } from "../validations/message.validations.js";

export default class MessageService {
    async createMessage(
        {
            conversationId,
            senderId,
            content
        }: {
            conversationId: number,
            senderId: number,
            content: string
        }
    ): Promise<
        {
        id: number,
        conversationId: number,
        senderId: number,
        content: string,
        message_type: string
        reply_to_message_id: number | null,
        createdAt: string,
        edited_at: string | null,
        deleted_at: string | null
    }
    > {
        const [member] = await db.orm.public.Direct_conversation_member.where({
            conversation_id: conversationId,
            user_id: senderId
        }).all();

        if(!member) {
            throw new Error("You are not a member of this conversations.")
        }

        return await db.orm.public.Direct_message.create({
            content: content,
            conversationId: conversationId,
            senderId: senderId
        })
    }

    async getMessages({
        conversationId,
        userId,
        limit = 50,
        offset = 1
    }: {
        conversationId: number;
        userId: number;
        limit: number;
        offset: number;
    }
    ) {
        const isMember = await this.checkConversationAccess({conversationId, userId});

        if(!isMember) {
            throw new Error("You are not a member of this conversations.")
        }

       return await db.orm.public.Direct_message.where({
            conversationId
        }).limit(limit)
        .offset(limit * offset)
        .orderBy((m) => m.createdAt.desc())
        .all();
    }

    async deleteMessage({messageId, userId}: {messageId: number, userId: number}) {
        const [message] = await db.orm.public.Direct_message.where({
            id: messageId
        }).all();

        if(!message) {
            throw new Error("Message not found");
        }

        if(message.senderId !== userId) {
            throw new Error(
                "You cannot delete this message"
            );
        }

        return await db.orm.public.Direct_message.where({
            id: messageId
        }).delete();
    }

    async checkConversationAccess(
        {
            conversationId,
            userId,
        }: {
            conversationId: number,
            userId: number
        }
    ){
        const [member] = await db.orm.public.Direct_conversation_member.where({
            conversation_id: conversationId,
            user_id: userId
        }).all();

        return member ? true : false;
    }

    async getMessage(messageId: number) {
        try {
            const message = await db.orm.public.Direct_message.where({id: messageId}).first();

            if(!message) {
                throw new Error("Invalid MessageId");
            }

            return message;

        } catch (err: any) {
            throw new Error(`ERROR on get message ::: ${err.message}`);
        }
    }
}

export const messageService = new MessageService();