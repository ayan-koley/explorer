import { Router } from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { requirePermission } from '../../middlewares/permission.middlewares.js';
import { Permission } from '../servers/server.permissions.js';
import { listChannels, createChannel, updateChannel, deleteChannel } from './channels.controllers.js';

const router = Router({ mergeParams: true });
router.use(verifyJWT);
router.param('channelId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid channel ID' });
  }
  next();
});
router.get('/', requirePermission(Permission.VIEW_CHANNEL), listChannels);
router.post('/', requirePermission(Permission.MANAGE_CHANNELS), createChannel);
router.patch('/:channelId', requirePermission(Permission.MANAGE_CHANNELS), updateChannel);
router.delete('/:channelId', requirePermission(Permission.MANAGE_CHANNELS), deleteChannel);
export default router;
