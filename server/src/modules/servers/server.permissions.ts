import { db } from "../../prisma/db.js";

export const Permission = {
  VIEW_CHANNEL: 1 << 0, // 1
  SEND_MESSAGES: 1 << 1, // 2
  MANAGE_MESSAGES: 1 << 2, // 4
  MANAGE_CHANNELS: 1 << 3, // 8
  MANAGE_SERVER: 1 << 4, // 16
  MANAGE_MEMBERS: 1 << 5, // 32
  MANAGE_ROLES: 1 << 6, // 64
  CONNECT: 1 << 7, // 128
  SPEAK: 1 << 8, // 256
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission]; // 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256

export const MEMBER_PERMISSIONS =
  Permission.VIEW_CHANNEL |
  Permission.SEND_MESSAGES |
  Permission.CONNECT |
  Permission.SPEAK;

export const ALL_PERMISSIONS = Object.values(Permission).reduce(
  (all, bit) => all | bit,
  0,
);

export type ServerAccess = {
  server: NonNullable<Awaited<ReturnType<typeof db.orm.public.Server.first>>>;
  member: Awaited<ReturnType<typeof db.orm.public.ServerMember.first>>;
  permissions: number | null;
  isOwner: boolean;
};

export async function getServerPermissions(
  serverId: number,
  userId: number,
): Promise<ServerAccess | null> {
  // find the server and check if the user is the owner
  const server = await db.orm.public.Server.first({ id: serverId });
  if (!server) return null;
  if (server.ownerId === userId) {
    return {
      server,
      member: null,
      permissions: ALL_PERMISSIONS,
      isOwner: true,
    };
  }

  // find the member and their role assignment
  const member = await db.orm.public.ServerMember.where({
    serverId,
    userId,
  }).first();
  if (!member)
    return { server, member: null, permissions: null, isOwner: false };

  const assignment = await db.orm.public.ServerMemberRole.where({
    serverId,
    userId,
  }).first();

  if (!assignment) return { server, member, permissions: 0, isOwner: false };
  
  const role = await db.orm.public.Role.first({ id: assignment.roleId });
  if (!role || role.serverId !== serverId) {
    return { server, member, permissions: 0, isOwner: false };
  }
  return { server, member, permissions: role.permissions, isOwner: false };
}

export async function getChannelAccess(channelId: number, userId: number) {
  const channel = await db.orm.public.Channel.first({ id: channelId });
  if (!channel) return null;
  const access = await getServerPermissions(channel.serverId, userId);
  if (!access) return null;
  if (
    channel.isPrivate &&
    !access.isOwner &&
    (access.permissions === null ||
      (access.permissions & Permission.MANAGE_CHANNELS) === 0)
  ) {
    return { channel, ...access, permissions: null };
  }
  return { channel, ...access };
}
