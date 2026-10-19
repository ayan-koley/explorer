import { Router } from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { listMessages, sendMessage, editMessage, deleteMessage } from './messages.controllers.js';

const router = Router();
router.use(verifyJWT);
router.param('channelId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid channel ID' });
  }
  next();
});
router.param('messageId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid message ID' });
  }
  next();
});
router.get('/channels/:channelId/messages', listMessages);
router.post('/channels/:channelId/messages', sendMessage);
router.patch('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);
export default router;
