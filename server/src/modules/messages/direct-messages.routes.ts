import { Router } from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import {
  getConversations,
  getDirectMessages,
  patchDirectMessage,
  postConversation,
  postDirectMessage,
  readDirectMessage,
  removeDirectMessage,
} from './direct-messages.controllers.js';

const router = Router();
router.use(verifyJWT);
router.param('conversationId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) return res.status(400).json({ success: false, data: null, message: 'Invalid conversation ID' });
  next();
});
router.param('messageId', (_req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) return res.status(400).json({ success: false, data: null, message: 'Invalid message ID' });
  next();
});

router.get('/conversations', getConversations);
router.post('/conversations', postConversation);
router.get('/conversations/:conversationId/messages', getDirectMessages);
router.post('/conversations/:conversationId/messages', postDirectMessage);
router.put('/conversations/:conversationId/read/:messageId', readDirectMessage);
router.patch('/messages/:messageId', patchDirectMessage);
router.delete('/messages/:messageId', removeDirectMessage);

export default router;
