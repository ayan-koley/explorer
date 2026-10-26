import type { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { db } from "../../prisma/db.js";
import {
  createServerSchema,
  updateServerSchema,
  roleSchema,
  updateRoleSchema,
} from "../../validations/server.validations.js";
import {
  assignRoleBodySchema,
  nicknameBodySchema,
} from "../../validations/server-member.validations.js";
import {
  MEMBER_PERMISSIONS,
  ALL_PERMISSIONS,
  Permission,
  getServerPermissions,
} from "./server.permissions.js";
import { routeIntParam } from "../../utils/routeParam.js";
import { uploadImage } from "../../utils/imagekit.js";

const createServer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const input = createServerSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json(ApiResponse.error(input.error.message));

  const created = await db.transaction(async (tx) => {
    const server = await tx.orm.public.Server.create({
      name: input.data.name,
      description: input.data.description,
      iconUrl: input.data.iconUrl,
      visibility: input.data.visibility,
      ownerId: req.authUser!.id,
    });
    const ownerRole = await tx.orm.public.Role.create({
      serverId: server.id,
      name: "owner",
      color: "#F1C40F",
      permissions: ALL_PERMISSIONS,
      position: 100,
    });
    await tx.orm.public.Role.create({
      serverId: server.id,
      name: "member",
      color: "#99AAB5",
      permissions: MEMBER_PERMISSIONS,
      position: 0,
      isDefault: true,
    });
    await tx.orm.public.ServerMember.create({
      serverId: server.id,
      userId: req.authUser!.id,
    });
    await tx.orm.public.ServerMemberRole.create({
      serverId: server.id,
      userId: req.authUser!.id,
      roleId: ownerRole.id,
    });
    await tx.orm.public.Channel.create({
      serverId: server.id,
      name: "general",
      type: "text",
      position: 0,
    });
    return server;
  });
  return res.status(201).json(ApiResponse.success(created, "Server created"));
});

const listMyServers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const memberships = await db.orm.public.ServerMember.where({
    userId: req.authUser.id,
  }).all();
  const owned = await db.orm.public.Server.where({
    ownerId: req.authUser.id,
  }).all();
  const joined = await Promise.all(
    memberships.map((member) =>
      db.orm.public.Server.first({ id: member.serverId }),
    ),
  );
  const servers = new Map(
    [...owned, ...joined]
      .filter((server) => server !== null)
      .map((server) => [server!.id, server!]),
  );
  return res.json(ApiResponse.success([...servers.values()]));
});

const discoverServers = asyncHandler(async (_req: Request, res: Response) => {
  const servers = await db.orm.public.Server.where({ visibility: "public" })
    .orderBy((server) => server.createdAt.desc())
    .limit(100)
    .all();
  return res.json(ApiResponse.success(servers));
});

const getServer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const access = await getServerPermissions(
    routeIntParam(req, "serverId"),
    req.authUser.id,
  );
  if (!access)
    return res.status(404).json(ApiResponse.error("Server not found"));
  if (access.server.visibility === "private" && access.permissions === null) {
    return res
      .status(403)
      .json(ApiResponse.error("You are not a member of this server"));
  }
  const channels =
    access.permissions === null
      ? []
      : await db.orm.public.Channel.where({ serverId: access.server.id })
          .orderBy((channel) => channel.position.asc())
          .all();
  const visibleChannels = channels.filter(
    (channel) =>
      !channel.isPrivate ||
      access.isOwner ||
      (access.permissions !== null &&
        (access.permissions & Permission.MANAGE_CHANNELS) !== 0),
  );
  return res.json(
    ApiResponse.success({ ...access.server, channels: visibleChannels }),
  );
});

const updateServer = asyncHandler(async (req: Request, res: Response) => {
  const input = updateServerSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json(ApiResponse.error(input.error.message));
  const server = await db.orm.public.Server.first({
    id: routeIntParam(req, "serverId"),
  });
  if (!server)
    return res.status(404).json(ApiResponse.error("Server not found"));
  const updated = await db.orm.public.Server.where({ id: server.id }).update(
    input.data,
  );
  return res.json(ApiResponse.success(updated, "Server updated"));
});

const updateServerIcon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  if (!req.file)
    return res.status(400).json(ApiResponse.error("Choose an image to upload."));
  const serverId = routeIntParam(req, "serverId");
  const server = await db.orm.public.Server.first({ id: serverId });
  if (!server)
    return res.status(404).json(ApiResponse.error("Server not found"));
  const uploaded = await uploadImage(req.file, "server-icons", serverId);
  await db.orm.public.Server.where({ id: serverId }).update({ iconUrl: uploaded.url });
  return res.json(ApiResponse.success({ iconUrl: uploaded.url }, "Server icon updated"));
});

//TODO: bug on delete server
const deleteServer = asyncHandler(async (req: Request, res: Response) => {
  const serverId = routeIntParam(req, "serverId");
  const server = await db.orm.public.Server.first({ id: serverId });

  if (!server)
    return res.status(404).json(ApiResponse.error("Server not found"));

  await db.transaction(async (tx) => {

    const channels = await tx.orm.public.Channel.where({ serverId }).all();
    for (const channel of channels) {
      await tx.orm.public.LegacyVoiceSession.where({
        channel_id: channel.id,
      }).delete();

      await tx.orm.public.Message.where({ channelId: channel.id }).update({
        replyToMessageId: null,
      });

      await tx.orm.public.Message.where({ channelId: channel.id }).delete();
    }

    await tx.orm.public.ServerMemberRole.where({ serverId }).delete();
    await tx.orm.public.ServerMember.where({ serverId }).delete();
    await tx.orm.public.Channel.where({ serverId }).delete();
    await tx.orm.public.Role.where({ serverId }).delete();
    await tx.orm.public.Server.where({ id: serverId }).delete();
  });
  return res.json(ApiResponse.success(null, "Server deleted"));
});

const joinServer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const serverId = routeIntParam(req, "serverId");
  const server = await db.orm.public.Server.first({ id: serverId });
  if (!server)
    return res.status(404).json(ApiResponse.error("Server not found"));
  if (server.visibility !== "public")
    return res.status(403).json(ApiResponse.error("This server is private"));
  const existing = await db.orm.public.ServerMember.where({
    serverId,
    userId: req.authUser.id,
  }).first();
  if (existing)
    return res.status(409).json(ApiResponse.error("You are already a member"));
  const role = await db.orm.public.Role.where({
    serverId,
    isDefault: true,
  }).first();
  if (!role)
    return res
      .status(500)
      .json(ApiResponse.error("Server default role is missing"));
  const member = await db.transaction(async (tx) => {
    const membership = await tx.orm.public.ServerMember.create({
      serverId,
      userId: req.authUser!.id,
    });
    await tx.orm.public.ServerMemberRole.create({
      serverId,
      userId: req.authUser!.id,
      roleId: role.id,
    });
    return membership;
  });
  return res.status(201).json(ApiResponse.success(member, "Joined server"));
});

const leaveServer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const serverId = routeIntParam(req, "serverId");
  const server = await db.orm.public.Server.first({ id: serverId });
  if (!server)
    return res.status(404).json(ApiResponse.error("Server not found"));
  if (server.ownerId === req.authUser.id)
    return res
      .status(400)
      .json(ApiResponse.error("Transfer ownership before leaving this server"));
  const member = await db.orm.public.ServerMember.where({
    serverId,
    userId: req.authUser.id,
  }).first();
  if (!member)
    return res
      .status(404)
      .json(ApiResponse.error("You are not a member of this server"));
  await db.transaction(async (tx) => {
    await tx.orm.public.ServerMemberRole.where({
      serverId,
      userId: req.authUser!.id,
    }).delete();
    await tx.orm.public.ServerMember.where({
      serverId,
      userId: req.authUser!.id,
    }).delete();
  });
  return res.json(ApiResponse.success(null, "Left server"));
});

const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const serverId = routeIntParam(req, "serverId");
  const memberships = await db.orm.public.ServerMember.where({ serverId })
    .orderBy((member) => member.joinedAt.asc())
    .limit(500)
    .all();
  const members = await Promise.all(
    memberships.map(async (member) => {
      const [user, assignment] = await Promise.all([
        db.orm.public.User.select(
          "id",
          "username",
          "full_name",
          "avatar_url",
        ).first({ id: member.userId }),
        db.orm.public.ServerMemberRole.where({
          serverId,
          userId: member.userId,
        }).first(),
      ]);
      const role = assignment
        ? await db.orm.public.Role.select(
            "id",
            "name",
            "color",
            "position",
          ).first({ id: assignment.roleId })
        : null;
      return { ...member, user, role };
    }),
  );
  return res.json(ApiResponse.success(members));
});

const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const serverId = routeIntParam(req, "serverId");
  const userId = Number(req.params.userId);
  const server = await db.orm.public.Server.first({ id: serverId });
  if (userId === server?.ownerId)
    return res
      .status(400)
      .json(ApiResponse.error("The server owner cannot be removed"));
  const member = await db.orm.public.ServerMember.where({
    serverId,
    userId,
  }).first();
  if (!member)
    return res.status(404).json(ApiResponse.error("Member not found"));
  await db.transaction(async (tx) => {
    await tx.orm.public.ServerMemberRole.where({ serverId, userId }).delete();
    await tx.orm.public.ServerMember.where({ serverId, userId }).delete();
  });
  return res.json(ApiResponse.success(null, "Member removed"));
});

const updateNickname = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser)
    return res.status(401).json(ApiResponse.error("Authentication required"));
  const serverId = routeIntParam(req, "serverId");
  const userId = Number(req.params.userId);
  if (req.authUser.id !== userId) {
    const access = await getServerPermissions(serverId, req.authUser.id);
    if (
      !access ||
      access.permissions === null ||
      (access.permissions & Permission.MANAGE_MEMBERS) !==
        Permission.MANAGE_MEMBERS
    ) {
      return res
        .status(403)
        .json(ApiResponse.error("You can only edit your own nickname"));
    }
  }
  const body = nicknameBodySchema.safeParse(req.body);
  if (!body.success)
    return res.status(400).json(ApiResponse.error(body.error.message));
  const member = await db.orm.public.ServerMember.where({
    serverId,
    userId,
  }).first();
  if (!member)
    return res.status(404).json(ApiResponse.error("Member not found"));
  const updated = await db.orm.public.ServerMember.where({
    serverId,
    userId,
  }).update({ nickname: body.data.nickname ?? null });
  return res.json(ApiResponse.success(updated, "Nickname updated"));
});

const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await db.orm.public.Role.where({
    serverId: routeIntParam(req, "serverId"),
  })
    .orderBy((role) => role.position.desc())
    .all();
  return res.json(ApiResponse.success(roles));
});

const createRole = asyncHandler(async (req: Request, res: Response) => {
  const input = roleSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json(ApiResponse.error(input.error.message));
  const access = res.locals.serverAccess as Awaited<
    ReturnType<typeof getServerPermissions>
  >;
  if (
    !access ||
    access.permissions === null ||
    (input.data.permissions & ~access.permissions) !== 0
  ) {
    return res
      .status(403)
      .json(ApiResponse.error("You cannot grant permissions you do not have"));
  }
  const existing = await db.orm.public.Role.where({
    serverId: access.server.id,
    name: input.data.name,
  }).first();
  if (existing)
    return res
      .status(409)
      .json(ApiResponse.error("A role with this name already exists"));
  const role = await db.orm.public.Role.create({
    serverId: access.server.id,
    name: input.data.name,
    color: input.data.color,
    permissions: input.data.permissions,
    position: input.data.position ?? 0,
  });
  return res.status(201).json(ApiResponse.success(role, "Role created"));
});

const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const input = updateRoleSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json(ApiResponse.error(input.error.message));

  const serverId = routeIntParam(req, "serverId");
  const role = await db.orm.public.Role.where({
    id: Number(req.params.roleId),
    serverId,
  }).first();

  if (!role) return res.status(404).json(ApiResponse.error("Role not found"));
  
  if (role.isDefault || role.name === "owner")
    return res
      .status(400)
      .json(ApiResponse.error("Built-in roles cannot be edited"));
  const access = res.locals.serverAccess as Awaited<
    ReturnType<typeof getServerPermissions>
  >;
  if (
    input.data.permissions !== undefined &&
    (!access ||
      access.permissions === null ||
      (input.data.permissions & ~access.permissions) !== 0)
  ) {
    return res
      .status(403)
      .json(ApiResponse.error("You cannot grant permissions you do not have"));
  }
  if (input.data.name && input.data.name !== role.name) {
    const existing = await db.orm.public.Role.where({
      serverId,
      name: input.data.name,
    }).first();
    if (existing)
      return res
        .status(409)
        .json(ApiResponse.error("A role with this name already exists"));
  }
  const updated = await db.orm.public.Role.where({ id: role.id }).update(
    input.data,
  );
  return res.json(ApiResponse.success(updated, "Role updated"));
});

const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await db.orm.public.Role.where({
    id: Number(req.params.roleId),
    serverId: routeIntParam(req, "serverId"),
  }).first();
  if (!role) return res.status(404).json(ApiResponse.error("Role not found"));
  if (role.isDefault || role.name === "owner")
    return res
      .status(400)
      .json(ApiResponse.error("Built-in roles cannot be deleted"));
  const assigned = await db.orm.public.ServerMemberRole.where({
    roleId: role.id,
  }).first();
  if (assigned)
    return res
      .status(409)
      .json(ApiResponse.error("Reassign members before deleting this role"));
  await db.orm.public.Role.where({ id: role.id }).delete();
  return res.json(ApiResponse.success(null, "Role deleted"));
});

const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const parsed = assignRoleBodySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json(ApiResponse.error(parsed.error.message));
  const serverId = routeIntParam(req, "serverId");
  const role = await db.orm.public.Role.where({
    id: parsed.data.roleId,
    serverId,
  }).first();
  if (!role) return res.status(404).json(ApiResponse.error("Role not found"));
  const access = res.locals.serverAccess as Awaited<
    ReturnType<typeof getServerPermissions>
  >;
  if (
    !access ||
    access.permissions === null ||
    (role.permissions & ~access.permissions) !== 0
  ) {
    return res
      .status(403)
      .json(
        ApiResponse.error(
          "You cannot assign a role with permissions you do not have",
        ),
      );
  }
  const userId = Number(req.params.userId);
  const member = await db.orm.public.ServerMember.where({
    serverId,
    userId,
  }).first();
  if (!member)
    return res.status(404).json(ApiResponse.error("Member not found"));
  const assignment = await db.orm.public.ServerMemberRole.where({
    serverId,
    userId,
  }).first();
  if (!assignment) {
    await db.orm.public.ServerMemberRole.create({
      serverId,
      userId,
      roleId: role.id,
    });
  } else {
    await db.orm.public.ServerMemberRole.where({ serverId, userId }).update({
      roleId: role.id,
    });
  }
  return res.json(
    ApiResponse.success({ userId, roleId: role.id }, "Role assigned"),
  );
});

export {
  createServer,
  listMyServers,
  discoverServers,
  getServer,
  updateServer,
  updateServerIcon,
  deleteServer,
  joinServer,
  leaveServer,
  listMembers,
  removeMember,
  updateNickname,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
};
