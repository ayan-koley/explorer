import { db } from "../prisma/db.js";
import { channelService } from "./channel.service.js";
import { servermemberService } from "./server-member.service.js";

export class ChannelMessageService {

    async sendMessage(
        channel_id: number,
        user_id: number,
        content: string
    ) {
        // // 1. Check whether channel exists
        const channel = await channelService.getChannel(channel_id, user_id);

        // // 2. Only TEXT channels can receive messages
        if (channel.type !== "text") {
            throw new Error("Messages can only be sent in text channels");
        }

        // // 3. Check whether user belongs to the server
        const member = await servermemberService.requireMember({server_id: channel.server_id, user_id})

        // 4. Create message
        const message = await db.orm.public.Channel_message.create(
            {
                channel_id,
                sender_id: user_id,
                content,
            }
        )
        return message;
    }

    async getMessages(
        channel_id: number,
        user_id: number,
        cursor?: string,
        limit: number = 50
    ) {
        // // Prevent user from requesting too many messages
        // const take = Math.min(limit, 100);

        // // 1. Check channel
        const channel = await channelService.getChannel(channel_id, user_id);

        const member = await servermemberService.requireMember({server_id: channel.server_id, user_id})

        // // 3. Fetch messages
        const messages = await db.orm.public.Channel_message.where({
            channel_id
        })
        .orderBy((m) => m.created_at.desc())
        .limit(limit)
        .include("user", (user) => user.select('id', 'username', 'avatar_url'))
        .all()

        return messages;
    }

    async getMessage(
        message_id: number
    ) {
        // 1. Find message
        const message = await db.orm.public.Channel_message
        .where({
            id: message_id
        })
        .include("channel", (channel) => channel.select("id", "name", "server_id"))
        .include("user", (user) => user.select("id", "username", "avatar_url"))
        .first();


        if (!message) {
            throw new Error("Message not found");
        }

        return message;
    }

    async editMessage(
        message_id: number,
        user_id: number,
        content: string
    ) {
        // 1. Find message
        const message = await this.getMessage(message_id);

        // // 3. Only message sender can edit
        if (message.sender_id !== user_id) {
            throw new Error("You can only edit your own messages");
        }

        // 4. Update message
        const edited_message =
            await db.orm.public.Channel_message
            .where({
                id: message_id
            })
            .update({
                content,
                edited_at: new Date(Date.now()).toISOString()
            })

        return edited_message;
    }

    async deleteMessage(
        message_id: number,
        user_id: number
    ) {

        const message = await this.getMessage(message_id);

        // // 3. Only message sender can edit
        if (message.sender_id !== user_id) {
            throw new Error("You can only edit your own messages");
        }

        const deleted_message = await db.orm.public.Channel_message.where(
            {
                id: message_id,
                sender_id: user_id
            }
        ).delete();
        return deleted_message;
    }
}


export const messageService = new ChannelMessageService();