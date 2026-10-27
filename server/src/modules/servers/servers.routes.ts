import { Router } from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { requirePermission } from '../../middlewares/permission.middlewares.js';
import {
  createServer, listMyServers, discoverServers, getServer, updateServer, updateServerIcon, deleteServer, joinServer, leaveServer,
  listMembers, removeMember, updateNickname, listRoles, createRole, updateRole, deleteRole, assignRole,
} from './servers.controllers.js';
import { Permission } from './server.permissions.js';
import channelsRoutes from '../channels/channels.routes.js';
import { imageUpload } from '../../middlewares/imageUpload.js';

const router = Router();
router.use(verifyJWT);
router.param('serverId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid server ID' });
  }
  next();
});
router.param('userId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) return res.status(400).json({ success: false, data: null, message: 'Invalid user ID' });
  next();
});
router.param('roleId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid role ID' });
  }
  next();
});

router.get('/discover', discoverServers);
router.get('/me', listMyServers);
router.post('/', createServer);
router.use('/:serverId/channels', channelsRoutes);
router.get('/:serverId', getServer);
router.patch('/:serverId', requirePermission(Permission.MANAGE_SERVER), updateServer);
router.post('/:serverId/icon', requirePermission(Permission.MANAGE_SERVER), imageUpload, updateServerIcon);
router.delete('/:serverId', requirePermission(Permission.MANAGE_SERVER), deleteServer);
router.post('/:serverId/join', joinServer);
router.delete('/:serverId/leave', leaveServer);

router.get('/:serverId/members', requirePermission(Permission.VIEW_CHANNEL), listMembers);
router.delete('/:serverId/members/:userId', requirePermission(Permission.MANAGE_MEMBERS), removeMember);
router.patch('/:serverId/members/:userId/nickname', updateNickname);
router.patch('/:serverId/members/:userId/role', requirePermission(Permission.MANAGE_ROLES), assignRole);

router.get('/:serverId/roles', requirePermission(Permission.VIEW_CHANNEL), listRoles);
router.post('/:serverId/roles', requirePermission(Permission.MANAGE_ROLES), createRole);
router.patch('/:serverId/roles/:roleId', requirePermission(Permission.MANAGE_ROLES), updateRole);
router.delete('/:serverId/roles/:roleId', requirePermission(Permission.MANAGE_ROLES), deleteRole);

export default router;
