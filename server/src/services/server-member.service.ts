import { db } from "../prisma/db.js"

export class ServerMemberService {
    async getServerMembers(server_id: number, user_id: number) {
        await this.requireMember({
            server_id,
            user_id
        });

        return await db.orm.public.Server_member.where({
            server_id
        }).all()
    }
    async addMember(
        {
            server_id,
            user_id,
            nickname
        }: {
            server_id: number,
            user_id: number,
            nickname?: string
        }
    ) {
        const newMember = await db.orm.public.Server_member.create({
            server_id,
            user_id,
            nickname
        })

        if(!newMember) {
            throw new Error("Server error to create new member ")
        }

        return newMember;
    }
    async removeMember(
        {
            server_id,
            user_id
        }: {
            server_id: number, 
            user_id: number
        }
    ) {
        return await db.orm.public.Server_member.where(
            {
                server_id,
                user_id
            }
        )
        .delete();
    }
    async updateMember(
        {
            server_id,
            user_id,
            nickname
        }: {
            server_id: number,
            user_id: number,
            nickname?: string
        }
    ) {
        const member = await this.isMember({
            server_id,
            user_id
        });
        
        if(!member) {
            throw new Error("user is not the member of the server ")
        }

        return await db.orm.public.Server_member.where({
            server_id,
            user_id
        })
        .update({
            nickname
        })
    }
    async requireMember(
        {
            server_id,
            user_id
        }: {
            server_id: number,
            user_id: number
        }
    ) {
        const member = await db.orm.public.Server_member.where({
            server_id,
            user_id
        }).first();

        if(!member) {
            throw new Error("user is not the member of the server");
        }

        return member;
    }
    async isMember(
        {
            server_id,
            user_id
        }: {
            server_id: number, 
            user_id: number
        }
    ) {
        const member = await db.orm.public.Server_member.where(
            {
                server_id,
                user_id
            }
        ).first();

        return !!member;
    }
}

export const servermemberService = new ServerMemberService()