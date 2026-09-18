import { db } from "../prisma/db.js";

export class ChannelService {

    // Create a channel inside a server
    async createChannel(
        {
            server_id,
            name,
            type
        }: {
            server_id: number,
            name: string,
            type: "text" | "voice"
        }
    ) {

        // 1. Check whether server exists
        // const server = await db.orm.public.Server
        //     .where({ id: server_id })
        //     .first();

        // if (!server) {
        //     throw new Error("SERVER_NOT_FOUND");
        // }

        // 2. Check whether user is a member of server
        // const member = await servermemberService.isMember({
        //     server_id,
        //     user_id
        // });

        // if (!member) {
        //     throw new Error("You are not a member of this server");
        // }

        // 3. Create channel
        const channel = await db.orm.public.Channel.create({
            server_id,
            name,
            type
        });

        if(!channel) {
            throw new Error("Faild to create channel")
        }

        return channel;
    }


    // Get all channels of a server
    async getServerChannels(
        server_id: number,
        user_id: number
    ) {

        // 1. Check server
        // const server = await db.orm.public.Server
        //     .where({ id: server_id })
        //     .first();

        // if (!server) {
        //     throw new Error("SERVER_NOT_FOUND");
        // }

        // 2. Check membership
        // const member = await servermemberService.isMember({
        //     server_id,
        //     user_id
        // });

        // if (!member) {
        //     throw new Error("You are not a member of this server");
        // }

        // 3. Get channels
        const channels = await db.orm.public.Channel
            .where({
                server_id
            })
            .orderBy((c) => c.created_at.asc())
            .all();

        return channels;
    }


    // Get one specific channel
    async getChannel(
        channel_id: number,
        user_id: number
    ) {

        // 1. Find channel
        const channel = await db.orm.public.Channel
            .where({
                id: channel_id
            })
            .include(
                "server",
                (server) => server.select("id", "name")
            )
            .first();

        if (!channel) {
            throw new Error("CHANNEL_NOT_FOUND");
        }

        // 2. Check whether user belongs to channel's server
        // const member = await servermemberService.isMember({
        //     server_id: channel.server_id,
        //     user_id
        // });

        // if (!member) {
        //     throw new Error("You are not a member of this server");
        // }

        return channel;
    }


    // Update channel
    async updateChannel(
        channel_id: number,
        user_id: number,
        data: {
            name?: string;
            type?: "text" | "voice";
        }
    ) {

        // 1. Find channel
        // const channel = await db.orm.public.Channel
        //     .where({
        //         id: channel_id
        //     })
        //     .first();

        // if (!channel) {
        //     throw new Error("CHANNEL_NOT_FOUND");
        // }

        // 2. Check whether user has permission
        // Usually this should be owner/admin/permission based,
        // NOT simply "is member".

        // 3. Update channel
        const updated_channel =
            await db.orm.public.Channel
                .where({
                    id: channel_id
                })
                .update(data);

        return updated_channel;
    }


    // Delete channel
    async deleteChannel(
        channel_id: number,
        user_id: number
    ) {

        // 1. Find channel
        // const channel = await db.orm.public.Channel
        //     .where({
        //         id: channel_id
        //     })
        //     .first();

        // if (!channel) {
        //     throw new Error("CHANNEL_NOT_FOUND");
        // }

        // 2. Check whether user has permission
        // Usually ADMIN / MANAGE_CHANNEL permission.

        // 3. Delete channel
        const deleted_channel =
            await db.orm.public.Channel
                .where({
                    id: channel_id
                })
                .delete();

        return deleted_channel;
    }
}


export const channelService = new ChannelService();