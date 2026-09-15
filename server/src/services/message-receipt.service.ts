import { db } from "../prisma/db.js";
import { messageService } from "./message.service.js";

class MessageReceiptService {

    async createMessageReceipt(messageId: number, userId: number) {
        try {
            const message = await messageService.getMessage(messageId);

            const receipt = await db.orm.public.Message_receipt.create({
                message_id: messageId,
                user_id: userId
            })

            return receipt;
        } catch (err: any) {
            throw new Error(`ERROR on crate mesage Receipt ::: ${err.message}`);
        }
    }

    async markDelivered(messageId: number, userId: number) {
        try {
            const message = await db.orm.public.Direct_message.where({
                id: messageId
            }).select('id', 'conversationId', 'senderId').first();

            if(!message) {
                throw new Error("Invalid message id");
            }

            if(message.senderId === userId) {
                throw new Error("Sender cannot mark own message as delivered");
            }

            const receipt = await db.orm.public.Message_receipt.where({
                message_id: message.id
            }).update({
                deliverd_at: new Date(Date.now()).toISOString()
            })
            
            return {
                senderId: message.senderId,
                messageId: message.id,
                deliveredAt: receipt?.deliverd_at
            }
        } catch (err: any) {
            throw new Error(`ERROR on makeDeliverd ::: ${err.message}`);
        }
    }

    async markRead(messageId: number, userId: number) {
        try {
            const message = await db.orm.public.Direct_message.where({
                id: messageId
            }).select('id', 'conversationId', 'senderId').first();

            if(!message) {
                throw new Error("Invalid message id");
            }

            if(message.senderId === userId) {
                throw new Error("Sender cannot mark own message as delivered");
            }

            const receipt = await db.orm.public.Message_receipt.where({
                message_id: message.id
            }).update({
                seen_at: new Date(Date.now()).toISOString()
            })
            
            return {
                senderId: message.senderId,
                messageId: message.id,
                readAt: receipt?.seen_at
            }
        } catch (err: any) {
            throw new Error(`ERROR on makeDeliverd ::: ${err.message}`);
        }
    }
}

export const messageReceiptService = new MessageReceiptService();