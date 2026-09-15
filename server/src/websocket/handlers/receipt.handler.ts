import { messageReceiptService } from "../../services/message-receipt.service.js";
import { connectionManager } from "../managers/connection.manager.js";

export async function receiptHandler(
    payload: { type: string, messageId: number },
    userId: number
) {
    switch (payload.type) {

        case "message:delivered":
            await handleDelivered(payload, userId);
            break;

        case "message:read":
            await handleRead(payload, userId);
            break;
    }
}

async function handleDelivered(
    payload: { messageId: number },
    userId: number
) {
    const result =
        await messageReceiptService.markDelivered(
            payload.messageId,
            userId
        );

    const senderSocket =
        connectionManager.get(result.senderId);

    if (
        senderSocket &&
        senderSocket.readyState === WebSocket.OPEN
    ) {
        senderSocket.send(JSON.stringify({
            type: "message:receipt",
            messageId: result.messageId,
            status: "delivered",
            deliveredAt: result.deliveredAt
        }));
    }
}
async function handleRead(
    payload: { messageId: number },
    userId: number
) {
    const result =
        await messageReceiptService.markRead(
            payload.messageId,
            userId
        );

    const senderSocket =
        connectionManager.get(result.senderId);

    if (
        senderSocket &&
        senderSocket.readyState === WebSocket.OPEN
    ) {
        senderSocket.send(JSON.stringify({
            type: "message:receipt",
            messageId: result.messageId,
            status: "read",
            deliveredAt: result.readAt
        }));
    }
}