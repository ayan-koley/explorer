import { db } from "../prisma/db.js"
import { servermemberService } from "./server-member.service.js";

type UpdateServerInput = {
    name?: string;
    icon_url?: string;
    visibility?: "public" | "private";
};

export class ServerService {

    async createServer({
        owner_id,
        name,
        icon_url,
        visibility,
    }: {
        owner_id: number,
        name: string,
        description?: string,
        icon_url?: string,
        visibility: "public" | "private"
    }) {
        const server = await db.orm.public.Server.create({
            owner_id,
            name,
            visibility,
            icon_url,
        })

        if(!server) {
            throw new Error("Internal Server error to create server")
        }
        return server;
    }
    async getUserServers(user_id: number) {
        return await db.orm.public.Server_member.where({
            user_id
        }).include("server")
        .all()
    }
    async getServer(
        {
            server_id,
            user_id
        }: {
            server_id: number,
            user_id: number
        }
    ) {
        const server = await db.orm.public.Server.where({
            id: server_id
        }).first()

        if(!server) {
            throw new Error("Server not found")
        }

        if(server.visibility === "private") {
            const member = await servermemberService.isMember({server_id: server.id, user_id})

            if(!member) {
                throw new Error("your are not a member of the server")
            }
        }

        return server;
    }
    async updateServer(
        {
            server_id,
            user_id,
            data
        }: {
            server_id: number,
            user_id: number,
            data: UpdateServerInput
        }
    ) {
        // check server is valid or not
        const server = await this.getServer({server_id, user_id});
        // match with user id and owner id 
        if(server.owner_id !== user_id) {
            throw new Error("User is not the owner of the server")
        }
        // update
        const updatedserver = await db.orm.public.Server.where({
            id: server_id,
            owner_id: user_id
        }).update(data)

        if(!updatedserver) {
            throw new Error("Faild to update server")
        }

        return updatedserver;
    }

    // TODO: Require to delete all dependent schmea first
    async deleteServer() {}

}

export const serverService = new ServerService();