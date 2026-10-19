import type { Request, RequestHandler } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getServerPermissions, type Permission } from '../modules/servers/server.permissions.js';
import { routeIntParam } from '../utils/routeParam.js';

export const hasPermission = (permissions: number, required: Permission): boolean =>
  (permissions & required) === required;

export const requirePermission = (permission: Permission, serverIdParam = 'serverId'): RequestHandler =>
  async (req: Request, res, next) => {
    if (!req.authUser) return res.status(401).json(ApiResponse.error('Authentication required'));
    const serverId = routeIntParam(req, serverIdParam);
    if (!Number.isSafeInteger(serverId) || serverId < 1) return res.status(400).json(ApiResponse.error('Valid server ID is required'));

    try {
      const access = await getServerPermissions(serverId, req.authUser.id);
      if (!access) return res.status(404).json(ApiResponse.error('Server not found'));
      if (access.permissions === null) return res.status(403).json(ApiResponse.error('You are not a member of this server'));
      if (!hasPermission(access.permissions, permission)) {
        return res.status(403).json(ApiResponse.error('You do not have permission to perform this action'));
      }
      res.locals.serverAccess = access;
      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * VIEW_CHANNEL
 * SEND_MESSAGES
 * MANAGE_MESSAGES
 * MANAGE_CHANNELS
 * MANAGE_SERVER
 * CONNECT
 * SPEAK
 */
